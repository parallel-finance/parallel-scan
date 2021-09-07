import { BlockInfo } from './blockInfo'
import { InternalState } from './internal'

export enum CollectionKey {
  InternalState = 'internalState',
  BlockInfo = 'blockInfo',
}

export type CollectionOf<T> = T extends 'internalState'
  ? InternalState
  : T extends 'blockInfo'
  ? BlockInfo
  : never
