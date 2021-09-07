import { options } from '@parallel-finance/api'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { BlockHash } from '@polkadot/types/interfaces'

export class Scanner {
  private api: ApiPromise
  private constructor(api: ApiPromise) {
    this.api = api
  }

  static async create(endpoint: string) {
    const api = await ApiPromise.create(
      options({
        provider: new WsProvider(endpoint),
      })
    )
    return new Scanner(api)
  }

  async getBlockHash(blockNumber: number) {
    const hash = await this.api.rpc.chain.getBlockHash(blockNumber)
    return hash
  }

  async processBlock(hash: BlockHash) {}
}
