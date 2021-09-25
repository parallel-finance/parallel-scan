import { CollectionCommon } from './common'

export type CrowdloanVO = {
  account: string
  amount: number
  referralCode: string
  paraId: number
  extrinsicHash: string
  timestamp: string
}

export type Crowdloan = CrowdloanVO & CollectionCommon
