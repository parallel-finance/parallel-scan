import { ApiPromise } from '@polkadot/api'
import { BlockHash, EventRecord } from '@polkadot/types/interfaces'
import { CollectionKey, CollectionOf } from '../model'

type Operator<T extends CollectionKey> = (
  key: T,
  record: CollectionOf<T>
) => Promise<void>

export class Scanner {
  private api: ApiPromise
  constructor(api: ApiPromise) {
    this.api = api
  }

  async handleEvent<T extends CollectionKey>(
    event: EventRecord,
    operator: Operator<T>
  ) {
    return
  }

  async processBlock<T extends CollectionKey>(
    hash: BlockHash,
    operator: Operator<T>
  ) {
    const events = await this.api.query.system.events.at(hash)
    await Promise.all(events.map((e) => this.handleEvent(e, operator)))
  }
}
