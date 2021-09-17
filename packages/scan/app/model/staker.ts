import { CollectionCommon } from './common'

export interface Staker extends CollectionCommon {
  stakers: {
    [staker: string]: number
  }
  
}
