import { CollectionKey, CollectionOf } from './model'
import { Event } from '@polkadot/types/interfaces'

type Distribute<U> = U extends any
  ? {
      col: U
      record: CollectionOf<U>
    }
  : never

export type Task = Distribute<CollectionKey>
export type Operator = (task: Task) => Promise<void>
export type EventHandler = (event: Event, operator: Operator) => Promise<void>
