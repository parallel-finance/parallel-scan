import { Db, MongoClient, Collection } from 'mongodb'
import { CollectionKey, CollectionOf } from '../model'

export class Store {
  private client: MongoClient
  private db: Db
  private cols: { [key in CollectionKey]: Collection<CollectionOf<key>> | null }

  private constructor(client: MongoClient) {
    this.db = client.db('parallel-scan')
    this.client = client
  }

  static async create(url: string) {
    const client = new MongoClient(url)
    await client.connect()
    return new Store(client)
  }

  getCol(key: CollectionKey) {
    if (this.cols[key] === null) {
      this.cols[key] = this.db.collection<CollectionOf<typeof key>>(key)
    }
    return this.cols[key]
  }

  async state() {
    const col = this.getCol('state')
    return (await col.findOne()) || { lastBlock: 0 }
  }

  async close() {
    await this.client.close()
  }
}
