import { ApiPromise } from '@polkadot/api'
import { BlockHash, Event } from '@polkadot/types/interfaces'
import { Task, Operator, EventHandler } from '../types'
import eventHandlers from './events'

export class Scanner {
  private api: ApiPromise
  private handlers: { [section: string]: { [method: string]: EventHandler } }
  constructor(api: ApiPromise) {
    this.api = api
    this.handlers = eventHandlers
  }

  async handleEvent(event: Event, operator: Operator) {
    const { section, method } = event
    if (!this.handlers[section] || !this.handlers[section][method]) {
      return
    }
    const handler = this.handlers[section][method]
    await handler(event, operator)
  }

  async processBlock(hash: BlockHash, operator: Operator) {
    const events = await this.api.query.system.events.at(hash)
    await Promise.all(
      events.map(({ event }) => this.handleEvent(event, operator))
    )
  }
}
