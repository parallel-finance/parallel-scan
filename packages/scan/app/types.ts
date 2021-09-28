import { Store } from './store'
import { ApiPromise } from '@polkadot/api'
import { Logger } from 'winston'
import { BlockInfo } from './model/blockInfo'

export type Processor = (
  store: Store,
  api: ApiPromise,
  logger: Logger
) => (newBlock: BlockInfo) => void

export type Maybe<T> = T | undefined | null
