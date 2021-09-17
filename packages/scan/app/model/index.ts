import { BlockInfo } from './blockInfo'
import { Staker } from './staker'
import { Crowdloan } from './crowdloan'

export type CollectionKey = 'blockInfo' | 'staker' | 'crowdloan'

export type CollectionOf<T> = T extends 'blockInfo'
  ? BlockInfo
  : T extends 'staker'
  ? Staker
  : T extends 'crowdloan'
  ? Crowdloan
  : never
