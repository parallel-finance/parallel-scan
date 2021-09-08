import { options } from '@parallel-finance/api'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { BlockHash } from '@polkadot/types/interfaces'
import { Scanner } from './scanner'
import { Store } from './store'
import { sleep } from './utils'
import { logger } from './logger'

interface ServiceOption {
  endpoint: string
  url: string
}

export class Service {
  private scanner: Scanner
  private db: Store
  private api: ApiPromise

  constructor(scanner: Scanner, db: Store, api: ApiPromise) {
    this.scanner = scanner
    this.db = db
    this.api = api
  }

  static async build({ endpoint, url }: ServiceOption) {
    const api = await ApiPromise.create(
      options({
        provider: new WsProvider(endpoint),
      })
    )
    const db = await Store.create(url)
    const scanner = new Scanner(api)
    return new Service(scanner, db, api)
  }
  async run() {
    await this.restore()
    while (true) {
      const [blockNumber, hash] = await this.upcomingBlock()

      /// Revert to nearest finalized block
      if (await this.isForkedBlock(hash)) {
        logger.debug(`Fork block#${blockNumber}:${hash} detected`)
        await this.revertToFinalized()
        continue
      }
      await this.scanner.processBlock(hash, this.db.insertRecord.bind(this.db))
      await this.db.insertRecord('blockInfo', {
        blockHeight: blockNumber,
        hash: hash.toString(),
      })
      logger.debug(`Block#${blockNumber} indexed`)
    }
  }

  private async restore() {
    // This block is ok cause it's committed at the last of workflow.
    const lastBlock = await this.db.lastBlockInfo()
    if (lastBlock) {
      logger.debug(
        `Drop block till #${lastBlock.blockHeight}:${lastBlock.hash}`
      )
      await this.db.resetTo(lastBlock.blockHeight)
      return
    }

    const genesisHash = await this.api.rpc.chain.getBlockHash(0)
    logger.debug(`Init genesis blcok: ${genesisHash.toHex()}`)
    await this.db.insertRecord('blockInfo', {
      blockHeight: 0,
      hash: genesisHash.toHex(),
    })
  }

  private async upcomingBlock(): Promise<[number, BlockHash]> {
    const { blockHeight } = await this.db.lastBlockInfo()
    const currentBlockNumber = blockHeight + 1
    while (true) {
      try {
        const hash = await this.api.rpc.chain.getBlockHash(currentBlockNumber)
        return [currentBlockNumber, hash]
      } catch {
        // It means the last block is the newest
        logger.debug('Waiting for new block ...')
        await sleep(1000)
      }
    }
  }

  private async isForkedBlock(hash: BlockHash) {
    const { hash: lastHash } = await this.db.lastBlockInfo()
    const { parentHash } = await this.api.rpc.chain.getHeader(hash)
    return parentHash.toHex() !== lastHash
  }

  private async revertToFinalized() {
    const finalizedHash = await this.api.rpc.chain.getFinalizedHead()
    const finalizedHeight = (
      await this.api.rpc.chain.getHeader(finalizedHash)
    ).number.toNumber()
    logger.debug(`Reset database to Block#${finalizedHeight}`)
    await this.db.resetTo(finalizedHeight)
  }
}
