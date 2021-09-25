import { BlockInfo } from './blockInfo'
import { Staker } from './staker'
import { Crowdloan } from './crowdloan'
import { Liquidation } from './liquidation'

export type CollectionToModel = {
  blockInfo: BlockInfo
  staker: Staker
  crowdloan: Crowdloan
  liquidation: Liquidation
}

export const enum Collections {
  blockInfo = 'blockInfo',
  staker = 'staker',
  crowdloan = 'crowdloan',
  liquidation = 'liquidation',
}

export const ALL_COLLECTIONS = [
  Collections.blockInfo,
  Collections.staker,
  Collections.crowdloan,
  Collections.liquidation
] as const

export type CollectionKey = typeof ALL_COLLECTIONS[number]

export type CollectionKeys = keyof CollectionToModel
export type Model<T extends CollectionKeys> = CollectionToModel[T]
