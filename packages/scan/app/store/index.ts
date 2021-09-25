import { Collections, Model } from './../model/index'
import { Db, MongoClient } from 'mongodb'
import { ALL_COLLECTIONS, CollectionKey } from '../model'
import { BlockInfo } from '../model/blockInfo'
import { ShortfallRecord } from '../model/liquidation'

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

  async setLastShortfallRecords(
    height: number,
    shortfallRecords: ShortfallRecord[]
  ) {
    await this.getCols(Collections.liquidation).insertOne({
      blockHeight: height,
      shortfallRecords,
    })
  }

  async setLastBlock(height: number, hash: string) {
    await this.getCols(Collections.blockInfo).insertOne({
      blockHeight: height,
      hash,
    })
  }

  async lastBlockInfo(): Promise<BlockInfo | null> {
    return await this.getNewestRecordOf(Collections.blockInfo)
  }

  async close() {
    await this.client.close()
  }

  /**
   * Drop document from given block number.
   * @param height - Document will be deleted from where.
   */
  async resetTo(height: number) {
    // TODO: only clear related collections, should not reset later if we only process the finalised block
    const collections: CollectionKey[] = [...ALL_COLLECTIONS]
    for (const key of collections) {
      await this.getCols(key).deleteMany({
        blockHeight: { $gt: height },
      })
    }
  }
}

export let store: Store
