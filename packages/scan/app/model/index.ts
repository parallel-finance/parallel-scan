import { BlockInfo, BlockInfoVO } from './blockInfo'
import { Staker, StakerVO } from './staker'
import { Crowdloan, CrowdloanVO } from './crowdloan'

export type CollectionToModel = {
  blockInfo: BlockInfo
  staker: Staker
  crowdloan: Crowdloan
}
export type CollectionToValueObject = {
  blockInfo: BlockInfoVO
  staker: StakerVO
  crowdloan: CrowdloanVO
}

export const enum Collections {
  blockInfo = 'blockInfo',
  staker = 'staker',
  crowdloan = 'crowdloan',
}

export const ALL_COLLECTIONS = [
  Collections.blockInfo,
  Collections.staker,
  Collections.crowdloan,
] as const
export type CollectionKey = typeof ALL_COLLECTIONS[number]

export type CollectionKeys = keyof CollectionToModel
export type Model<T extends CollectionKeys> = CollectionToModel[T]
export type ValueObject<T extends CollectionKeys> = CollectionToValueObject[T]
