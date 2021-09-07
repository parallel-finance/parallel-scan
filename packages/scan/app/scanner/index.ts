import { options } from '@parallel-finance/api'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { BlockHash, EventRecord } from '@polkadot/types/interfaces'
import { CollectionKey, CollectionOf } from '../model'
import { Task } from '../task'

type OnRevert = (newHead: number) => Promise<void>
type Operator = (task: Task) => Promise<void>

export class Scanner {
  private api: ApiPromise
  private constructor(api: ApiPromise) {
    this.api = api
  }

  static async create(endpoint: string) {
    const api = await ApiPromise.create(
      options({
        provider: new WsProvider(endpoint),
      })
    )
    return new Scanner(api)
  }

  async getBlockHash(blockNumber: number) {
    const hash = await this.api.rpc.chain.getBlockHash(blockNumber)
    return hash
  }

  async isForked(hash: BlockHash) {
    // TODO(Alan WANG): not implement
    return false
  }

  async revertForkedBlock(onRevert: OnRevert) {}

  async handleEvent(event: EventRecord): Promise<Task> {
    return {
      col: CollectionKey.InternalState,
      record: {
        lastBlock: 0,
      },
    }
  }

  async processBlock(hash: BlockHash, onRevert: OnRevert, handler: Operator) {
    if (await this.isForked(hash)) {
      await this.revertForkedBlock(onRevert)
      return
    }
    const events = await this.api.query.system.events.at(hash)
    for (const event of events) {
      await this.handleEvent(event)
    }
    await handler({
      col: CollectionKey.InternalState,
      record: {
        lastBlock: 0,
      },
    })
  }
}
