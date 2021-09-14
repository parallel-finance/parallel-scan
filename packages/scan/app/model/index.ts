import { BlockInfo } from './blockInfo'
import { Staker } from './staker'

export type CollectionKey = 'blockInfo' | 'staker'

export type CollectionOf<T> = T extends 'blockInfo'
  ? BlockInfo
  : T extends 'staker'
  ? Staker
  : never
