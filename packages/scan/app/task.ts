import { CollectionKey, CollectionOf } from './model'

type Distribute<U> = U extends any
  ? {
      col: U
      record: CollectionOf<U>
    }
  : never

export type Task = Distribute<CollectionKey>
