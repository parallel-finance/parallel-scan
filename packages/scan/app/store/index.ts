import { Task } from 'app/task'
import { Db, MongoClient } from 'mongodb'
import { CollectionKey, CollectionOf } from '../model'
import { BlockInfo } from '../model/blockInfo'

export class Store {
  private client: MongoClient
  private db: Db

  private constructor(client: MongoClient) {
    this.db = client.db('parallel-scan')
    this.client = client
  }

  static async create(url: string) {
    const client = new MongoClient(url)
    await client.connect()
    return new Store(client)
  }

  getCols<T extends CollectionKey>(key: T) {
    return this.db.collection<CollectionOf<T>>(key)
  }

  async setLastBlock(height: number, hash: string) {
    this.insertRecord({
      col: 'blockInfo',
      record: {
        blockHeight: height,
        hash,
      },
    })
  }

  /**
   * Helper function to get internal state
   */
  async lastBlockInfo(): Promise<BlockInfo | null> {
    const col = this.getCols('blockInfo')
    return await col.find().sort({ blockHeight: -1 }).limit(1).next()
  }

  async close() {
    await this.client.close()
  }

  /**
   * Drop document from given block number.
   * @param blockNumber - Document will be deleted from where.
   */
  async resetTo(height: number) {
    const collections: CollectionKey[] = ['blockInfo']
    for (const key of collections) {
      await this.getCols(key).deleteMany({
        blockHeight: { $gt: height },
      })
    }
  }

  async insertRecord(task: Task) {
    await this.getCols(task.col).insertOne(task.record)
  }
}
