import { CollectionCommon } from './common'
import { ShortfallRecord } from 'app/scanner/solvers/liquidation'

export interface Liquidation extends CollectionCommon {
    shortfallRecords: ShortfallRecord[]
}