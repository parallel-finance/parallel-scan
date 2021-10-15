import { ApiOptions } from '@polkadot/api/types'
import { ApiPromise, WsProvider } from '@polkadot/api'

export let api: ApiPromise

export namespace Api {
  export async function init(endpoint: string) {
    console.log(`endpoint: ${endpoint}`)
    api = await ApiPromise.create(
      { provider: new WsProvider(endpoint) } as ApiOptions
    )
  }
}
