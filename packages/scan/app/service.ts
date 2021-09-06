import { options } from '@parallel-finance/api'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { logger } from './logger'

interface ServiceOption {
  endpoint: string
  url: string
  port: string
}

class Service {
  private api: ApiPromise

  constructor({ endpoint, url, port }: ServiceOption) {
    this.api = new ApiPromise(
      options({
        provider: new WsProvider(endpoint),
      })
    )

    this.api.once('connected', () => logger.info(`${endpoint} connected`))
    this.api.once('disconnected', () => logger.info(`${endpoint} disconnected`))
  }

  get apiReady() {
    return this.api.isConnected
  }
}
