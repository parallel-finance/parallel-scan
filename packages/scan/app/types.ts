import { BlockHash } from '@polkadot/types/interfaces'
import { Store } from './store'
import { ApiPromise } from '@polkadot/api'

export type Processor = (
  store: Store,
  api: ApiPromise
) => (hash: BlockHash, height: number, store: Store) => void
