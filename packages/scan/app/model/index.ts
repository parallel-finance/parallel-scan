import { State } from './state'

export type CollectionKey = 'state'

export type CollectionOf<T> = T extends 'state' ? State : never
