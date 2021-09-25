import { CollectionCommon } from './common'

export type BlockInfoVO = {
  hash: string
}

export type BlockInfo = BlockInfoVO & CollectionCommon;
