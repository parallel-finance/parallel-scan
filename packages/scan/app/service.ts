import { BlockHash } from '@polkadot/types/interfaces'
import { scanner } from './scanner'
import { Store, store } from './store'
import { sleep } from './utils'
import { logger } from './logger'
import { Api, api } from './api'

interface ServiceOption {
  endpoint: string
  url: string
  initBlockNumber: number
}

export class Service {
  private initBlockNumber: number

  private constructor(initBlockNumber: number) {
    this.initBlockNumber = initBlockNumber
  }

  static async build({ endpoint, url, initBlockNumber }: ServiceOption) {
    await Api.init(endpoint)
    await Store.init(url)
    return new Service(initBlockNumber)
  }

  async run() {
    await this.restore()
    while (true) {
      const [blockNumber, hash] = await this.upcomingBlock()
      logger.debug(`Receive upcoming block#${blockNumber}: ${hash.toString()}`)

      /// Revert to nearest finalized block
      if (await this.isForkedBlock(hash)) {
        logger.debug(`Fork block#${blockNumber}:${hash} detected`)
        await this.revertToFinalized()
        continue
      }
      await scanner.processBlock(hash, blockNumber)
      await store.setLastBlock(blockNumber, hash.toHex())
      logger.debug(`Block#${blockNumber} indexed`)
    }
  }

  private async restore() {
    // This block is ok cause it's committed at the last of workflow.
    const lastBlock = await store.lastBlockInfo()
    if (lastBlock) {
      logger.debug(
        `Drop block till #${lastBlock.blockHeight}:${lastBlock.hash}`
      )
      await store.resetTo(lastBlock.blockHeight)
      return
    }

    // Init
    const genesisHash = await api.rpc.chain.getBlockHash(this.initBlockNumber)
    logger.debug(
      `Init blcok from ${this.initBlockNumber}: ${genesisHash.toHex()}`
    )
    await store.setLastBlock(this.initBlockNumber, genesisHash.toHex())
  }

  private async upcomingBlock(): Promise<[number, BlockHash]> {
    const { blockHeight } = (await store.lastBlockInfo())!
    const currentBlockNumber = blockHeight + 1
    while (true) {
      const hash = await api.rpc.chain.getBlockHash(currentBlockNumber)
      if (
        hash.toString() !==
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        return [currentBlockNumber, hash]
      }
      logger.debug('Waiting for new block ...')
      await sleep(6000)
    }
  }

  private async isForkedBlock(hash: BlockHash) {
    const { hash: lastHash } = (await store.lastBlockInfo())!
    const { parentHash } = await api.rpc.chain.getHeader(hash)
    return parentHash.toHex() !== lastHash
  }

  private async revertToFinalized() {
    const finalizedHash = await api.rpc.chain.getFinalizedHead()
    const finalizedHeight = (
      await api.rpc.chain.getHeader(finalizedHash)
    ).number.toNumber()
    logger.debug(`Reset database to Block#${finalizedHeight}`)
    await store.resetTo(finalizedHeight)
  }
}
