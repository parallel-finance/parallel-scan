import { CollectionCommon } from './common'

export type ShortfallRecord = {
  borrower: string;
  liquidity: string;
  shortfall: string;
  status: number;
}

export type Liquidation = {
  shortfallRecords: ShortfallRecord[]
} & CollectionCommon
