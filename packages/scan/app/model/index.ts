import { BlockInfo } from './blockInfo'
import { Staker } from './staker'
import { Crowdloan } from './crowdloan'

export interface CollectionToModel {
  blockInfo: BlockInfo
  staker: Staker
  crowdloan: Crowdloan
}

export type CollectionKeys = keyof CollectionToModel

export const ALL_COLLECTIONS = ['blockInfo', 'staker', 'crowdloan'] as const

export type CollectionKey = typeof ALL_COLLECTIONS[number]

export type Model<T extends CollectionKeys> = CollectionToModel[T]
