import { options } from '@parallel-finance/api'
import { ApiPromise, WsProvider } from '@polkadot/api'

export let api: ApiPromise

export namespace Api {
  export async function init(endpoint: string) {
    console.log(`endpoint: ${endpoint}`)
    api = await ApiPromise.create(
      options({ provider: new WsProvider(endpoint) })
    )
  }
}
