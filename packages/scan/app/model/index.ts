import { BlockInfo } from './blockInfo'
import { Staker } from './staker'
import { Liquidation } from './liquidation'


export type CollectionKey = 'blockInfo' | 'staker' | 'liquidation' 

export type CollectionOf<T> = T extends 'blockInfo'
  ? BlockInfo
  : T extends 'staker'
  ? Staker
  : T extends 'liquidation'
  ? Liquidation
  : never
