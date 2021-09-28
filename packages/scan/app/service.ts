import { BlockHash } from '@polkadot/types/interfaces'
import { Store, store } from './store'
import { sleep } from './utils'
import { logger } from './logger'
import { Api, api } from './api'
import { Processor } from './types'
import { BlockInfo } from './model/blockInfo'

interface ServiceOption {
  endpoint: string
  url: string
  blockNumber: number
  processor: Processor
}

export class Service {
  static initBlockHeight: number
  static processor: Processor

  static async build({ endpoint, url, blockNumber, processor }: ServiceOption) {
    await Api.init(endpoint)
    await Store.init(url)
    this.initBlockHeight = blockNumber
    this.processor = processor
    return new Service()
  }

  async run() {
    let lastBlockInfo: BlockInfo = await this.restore()
    while (true) {
      const newBlock: BlockInfo = await this.upcomingBlock(lastBlockInfo)
      logger.debug(
        `Receive upcoming block#${
          newBlock.blockHeight
        }: ${newBlock.hash.toString()}`
      )

      // Revert to nearest finalized block
      logger.debug(`check if is forkedBlock`);
      if (await this.isForkedBlock(newBlock.hash)) {
        logger.debug(
          `Fork block#${newBlock.blockHeight}:${newBlock.hash} detected`
        )
        await this.revertToFinalized()
        continue
      }
      await Service.processor(store, api, logger)(newBlock)
      logger.debug(`update the lastBlock in db`);
      await store.setLastBlock(newBlock)
      logger.debug(`Block#${newBlock.blockHeight} indexed`)
      lastBlockInfo = newBlock
    }
  }

  private async restore(): Promise<BlockInfo> {
    // This block is ok cause it's committed at the last of workflow.
    const lastBlock = await store.lastBlockInfo()
    if (lastBlock) {
      logger.debug(
        `Drop block till #${lastBlock.blockHeight}:${lastBlock.hash}`
      )
      await store.resetTo(lastBlock.blockHeight)
      return lastBlock
    }

    const genesisHash = await api.rpc.chain.getBlockHash(
      Service.initBlockHeight
    )
    logger.debug(
      `Init blcok from ${Service.initBlockHeight}: ${genesisHash.toHex()}`
    )
    let initBlock = {
      blockHeight: Service.initBlockHeight,
      hash: genesisHash.toHex(),
    }
    await store.setLastBlock(initBlock)
    return initBlock
  }

  private async upcomingBlock(currentBlock: BlockInfo): Promise<BlockInfo> {
    const { blockHeight } = currentBlock
    const currentBlockNumber = blockHeight + 1
    while (true) {
      const hash = await api.rpc.chain.getBlockHash(currentBlockNumber)
      if (
        hash.toString() !==
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        return {
          blockHeight: currentBlockNumber,
          hash: hash.toString(),
        }
      }
      logger.debug('Waiting for new block ...')
      await sleep(6000)
    }
  }

  private async isForkedBlock(hash: string) {
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
