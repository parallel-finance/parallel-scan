import { ApiPromise } from '@polkadot/api'
import { BlockHash, EventRecord } from '@polkadot/types/interfaces'
import { CollectionKey, CollectionOf } from '../model'
import { Task } from '../task'

type Operator = (task: Task) => Promise<void>

export class Scanner {
  private api: ApiPromise
  constructor(api: ApiPromise) {
    this.api = api
  }

  async handleEvent(event: EventRecord, operator: Operator) {
    return
  }

  async processBlock(hash: BlockHash, operator: Operator) {
    const events = await this.api.query.system.events.at(hash)
    await Promise.all(events.map((e) => this.handleEvent(e, operator)))
  }
}
