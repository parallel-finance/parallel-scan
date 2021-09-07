import { Db, MongoClient, Collection } from 'mongodb'
import { CollectionKey, CollectionOf } from '../model'
import { InternalState } from '../model/internal'

type CollectionMap = { [key in CollectionKey]: Collection<CollectionOf<key>> }

export class Store {
  private client: MongoClient
  private db: Db
  public cols: CollectionMap

  private constructor(client: MongoClient) {
    this.db = client.db('parallel-scan')
    this.client = client
    for (let key in CollectionKey) {
      this.cols[key] = this.db.collection<CollectionOf<typeof key>>(key)
    }
  }

  static async create(url: string) {
    const client = new MongoClient(url)
    await client.connect()
    return new Store(client)
  }

  /**
   * Helper function to get internal state
   */
  async state(): Promise<InternalState> {
    const col = this.cols.internalState
    return (await col.findOne()) || { lastBlock: 0 }
  }

  async setLastBlock(newHead: number) {
    const col = this.cols.internalState
    await col.updateOne({}, { $set: { lastBlock: newHead } }, { upsert: true })
  }

  async close() {
    await this.client.close()
  }

  /**
   * Drop document from given block number(include).
   * @param blockNumber - Document will be deleted from where.
   */
  async dropBlockFrom(blockNumber: number) {
    for (const key in CollectionKey) {
      if (key.startsWith('internal')) continue
      await this.cols[key].deleteMany({ blockHeight: { $gte: blockNumber } })
    }
  }

  async handleEvent(event: any) {}
}
