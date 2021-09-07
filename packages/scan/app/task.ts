import { CollectionKey, CollectionOf } from './model'

export type Task =
  | {
      col: CollectionKey.InternalState
      record: CollectionOf<CollectionKey.InternalState>
    }
  | {
      col: CollectionKey.BlockInfo
      record: CollectionOf<CollectionKey.BlockInfo>
    }
