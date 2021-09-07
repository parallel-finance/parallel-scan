import { Scanner } from './scanner'
import { Store } from './store'

interface ServiceOption {
  endpoint: string
  url: string
}

export class Service {
  private scanner: Scanner
  private db: Store

  constructor(scanner: Scanner, db: Store) {
    this.scanner = scanner
    this.db = db
  }

  static async build({ endpoint, url }: ServiceOption) {
    const scanner = await Scanner.create(endpoint)
    const db = await Store.create(url)
    return new Service(scanner, db)
  }

  async run() {
    //TODO(Alan WANG): process events
  }
}
