import { BlockInfo } from './blockInfo'
import { InternalState } from './internal'

export type CollectionKey = 'internalState' | 'blockInfo'

export type CollectionOf<T extends CollectionKey> = T extends 'internalState'
  ? InternalState
  : T extends 'blockInfo'
  ? BlockInfo
  : never
