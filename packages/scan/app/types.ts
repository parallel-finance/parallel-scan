import { BlockHash } from '@polkadot/types/interfaces'
import { Store } from './store'
import { ApiPromise } from '@polkadot/api'
import { Logger } from 'winston'

export type Processor = (
  store: Store,
  api: ApiPromise,
  logger: Logger
) => (hash: BlockHash, height: number) => void
