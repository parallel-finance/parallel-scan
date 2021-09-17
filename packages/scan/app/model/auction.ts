import { CollectionCommon } from './common'

export interface Auction extends CollectionCommon {
  account: string
  amount: number
  referralCode: string
  paraId: number
  extrinsicHash: string
  timestamp: string
}
