import { BlockHash, Event } from '@polkadot/types/interfaces'
import eventHandlers from './events'
import { EventHandler } from '../types'
import { api } from '../api'
import { liquidationSolver } from './solvers/liquidation'
class Scanner {
  private handlers: { [section: string]: { [method: string]: EventHandler } }
  private liquidationSolver

  constructor() {
    this.handlers = eventHandlers
    this.liquidationSolver = liquidationSolver
  }

  async handleEvent(event: Event, height: number) {
    const { section, method } = event
    if (!this.handlers[section] || !this.handlers[section][method]) {
      return
    }
    const handler = this.handlers[section][method]
    await handler(event, height)
  }

  async processBlock(hash: BlockHash, height: number) {
    const events = await api.query.system.events.at(hash)
    const ass = await this.liquidationSolver.liquidate(api, height)
  
    await Promise.all(
      events.map(({ event }) => this.handleEvent(event, height))
    )
  }
}

export const scanner = new Scanner()
