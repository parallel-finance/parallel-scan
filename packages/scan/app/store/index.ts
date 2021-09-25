import { Model } from './../model/index'
import { Db, MongoClient } from 'mongodb'
import { ALL_COLLECTIONS, CollectionKey } from '../model'
import { BlockInfo } from '../model/blockInfo'

export class Store {
  private client: MongoClient
  private db: Db

  private constructor(client: MongoClient) {
    this.db = client.db()
    this.client = client
  }

  static async init(url: string) {
    const client = new MongoClient(url)
    await client.connect()
    store = new Store(client)
  }

  getCols<T extends CollectionKey>(key: T) {
    return this.db.collection<Model<T>>(key)
  }

  async getNewestRecordOf<T extends CollectionKey>(key: T) {
    const col = this.getCols(key)
    return await col.findOne({}, { sort: { blockHeight: -1 } })
  }

  async setLastBlock(height: number, hash: string) {
    await this.getCols('blockInfo').insertOne({ blockHeight: height, hash })
  }

  async lastBlockInfo(): Promise<BlockInfo | null> {
    return await this.getNewestRecordOf('blockInfo')
  }

  async close() {
    await this.client.close()
  }

  /**
   * Drop document from given block number.
   * @param blockNumber - Document will be deleted from where.
   */
  async resetTo(height: number) {
    const collections: CollectionKey[] = [...ALL_COLLECTIONS]
    for (const key of collections) {
      await this.getCols(key).deleteMany({
        blockHeight: { $gt: height },
      })
    }
  }
}

export let store: Store
