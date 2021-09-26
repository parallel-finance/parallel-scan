import { CollectionCommon } from './common'

export type StakerVO = {
  stakers: { [staker: string]: number }
}
export type Staker = StakerVO & CollectionCommon
