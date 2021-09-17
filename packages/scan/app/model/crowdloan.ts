import { CollectionCommon } from './common'

export interface Crowdloan extends CollectionCommon {
  account: string
  amount: number
  referralCode: string
  paraId: number
  extrinsicHash: string
  timestamp: string
}
