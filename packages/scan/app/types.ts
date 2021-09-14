import { CollectionKey, CollectionOf } from './model'
import { Event } from '@polkadot/types/interfaces'

export type EventHandler = (event: Event) => Promise<void>
