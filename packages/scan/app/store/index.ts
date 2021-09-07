import { Db, MongoClient, Collection } from 'mongodb'
import { keys } from 'ts-transformer-keys'
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
    for (let key of keys<CollectionMap>()) {
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

  async close() {
    await this.client.close()
  }

  /**
   * Drop document from given block number(include).
   * @param blockNumber - Document will be deleted from where.
   */
  async dropBlockFrom(blockNumber: number) {
    keys<CollectionMap>()
      .filter((v) => !v.startsWith('internal'))
      .forEach(async (key) => {
        await this.cols[key].deleteMany({ blockHeight: { $gte: blockNumber } })
      })
  }
}
