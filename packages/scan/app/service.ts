import { BlockHash } from '@polkadot/types/interfaces'
import { Scanner } from './scanner'
import { Store } from './store'
import { sleep } from './utils'

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
    const service = new Service(scanner, db)
    await service.restore()
    return service
  }

  async run() {
    //TODO(Alan WANG): process events
    const onRevert = async (newHead: number) => {
      await this.db.setLastBlock(newHead)
      await this.db.dropBlockFrom(newHead + 1)
    }
    while (true) {
      const hash = await this.upcomingBlockHash()
      await this.scanner.processBlock(
        hash,
        onRevert,
        this.db.handleEvent.bind(this.db)
      )
    }
  }

  private async restore() {
    // This block is ok cause it's committed at the last of workflow.
    const { lastBlock } = await this.db.state()
    await this.db.dropBlockFrom(lastBlock + 1)
  }

  private async upcomingBlockHash() {
    const { lastBlock } = await this.db.state()
    while (true) {
      try {
        const hash = await this.scanner.getBlockHash(lastBlock + 1)
        return hash
      } catch {
        // It means the last block is the newest
        await sleep(1000)
      }
    }
  }
}
