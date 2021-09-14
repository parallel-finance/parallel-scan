import { BlockHash, Event } from '@polkadot/types/interfaces'
import eventHandlers from './events'
import { EventHandler } from '../types'
import { api } from '../api'

class Scanner {
  private handlers: { [section: string]: { [method: string]: EventHandler } }

  constructor() {
    this.handlers = eventHandlers
  }

  async handleEvent(event: Event) {
    const { section, method } = event
    if (!this.handlers[section] || !this.handlers[section][method]) {
      return
    }
    const handler = this.handlers[section][method]
    await handler(event)
  }

  async processBlock(hash: BlockHash) {
    const events = await api.query.system.events.at(hash)
    await Promise.all(events.map(({ event }) => this.handleEvent(event)))
  }
}

export const scanner = new Scanner()
