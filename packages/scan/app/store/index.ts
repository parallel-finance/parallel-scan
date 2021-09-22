import { Db, MongoClient } from 'mongodb'
import { CollectionKey, CollectionOf } from '../model'
import { BlockInfo } from '../model/blockInfo'
import { ShortfallRecord } from '../scanner/solvers/liquidation'
export class Store {
  private client: MongoClient
  private db: Db

  private constructor(client: MongoClient) {
    this.db = client.db('parallel-scan')
    this.client = client
  }

  static async init(url: string) {
    const client = new MongoClient(url)
    await client.connect()
    store = new Store(client)
  }

  getCols<T extends CollectionKey>(key: T) {
    return this.db.collection<CollectionOf<T>>(key)
  }

  async getNewestRecordOf<T extends CollectionKey>(key: T) {
    const col = this.getCols(key)
    return await col.findOne({}, { sort: { blockHeight: -1 } })
  }

  async setLastShortfallRecords(height: number, shortfallRecords: ShortfallRecord[]) {
    await this.getCols('liquidation').insertOne({ blockHeight: height, shortfallRecords})
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
    const collections: CollectionKey[] = ['blockInfo']
    for (const key of collections) {
      await this.getCols(key).deleteMany({
        blockHeight: { $gt: height },
      })
    }
  }
}

export let store: Store
