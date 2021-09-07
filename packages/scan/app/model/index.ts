import { InternalState } from './internal'

export type CollectionKey = 'internalState'

export type CollectionOf<T> = T extends 'internalState' ? InternalState : never
