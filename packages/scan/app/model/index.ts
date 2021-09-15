import { BlockInfo } from './blockInfo'
import { Staker } from './staker'
import { Auction } from './auction'

export type CollectionKey = 'blockInfo' | 'staker' | 'auction'

export type CollectionOf<T> = T extends 'blockInfo'
  ? BlockInfo
  : T extends 'staker'
  ? Staker
  : T extends 'auction'
  ? Auction
  : never
