import { api } from '../../api';
import '@parallel-finance/types';
import { AccountId, Liquidity, Shortfall } from '@parallel-finance/types/interfaces';
import * as lds from 'lodash';
import { logger } from '../../../app/logger';

export type ShortfallRecord = {
  borrower: string;
  liquidity: string;
  shortfall: string;
  status: number;
}

export class LiquidationSolver {
    private static liquidationSolver: LiquidationSolver;

    public static getSolver() {
      if (!LiquidationSolver.liquidationSolver) {
        LiquidationSolver.liquidationSolver = new LiquidationSolver();
      }
  
      return LiquidationSolver.liquidationSolver;
    }

    public async liquidate(blockNumber: number): Promise<Array<ShortfallRecord>> {
      logger.debug(`Liquidating... block#${blockNumber}`)
      const shorfallRecords = await this.accountsLiquidity();
      logger.debug(`shorfallRecords: ${shorfallRecords.length? JSON.stringify(shorfallRecords) : "None" }`)

      return shorfallRecords
    }

    async accountsLiquidity(): Promise<Array<ShortfallRecord>> {
      const borrowerKeys = await api.query.loans.accountBorrows.keys();
      let borrowers = borrowerKeys.map(({ args: [_, accountId] }) => {
        return accountId;
      });
      borrowers = lds.uniqWith(borrowers, lds.isEqual);
    
      const asyncFilter = async (arr: Array<AccountId>, predicate: (a: AccountId) => Promise<ShortfallRecord>) => {
        const results = await Promise.all(arr.map(predicate));
        
        return results.filter((_v, index) => results[index]["status"])
      };

      return await asyncFilter(borrowers, async (accountId) => {
        const accountLiquidity: [Liquidity, Shortfall] = await api.rpc.loans.getAccountLiquidity(accountId, null);

        const shorfallRecord: ShortfallRecord = {
          borrower: accountId.toString(),
          liquidity: accountLiquidity[0].toString(),
          shortfall: accountLiquidity[1].toString(),
          // Retrieve only non-zero shortfall
          status: !accountLiquidity[1].toBn().isZero() ? 1 : 0
        }

        return shorfallRecord
      });
    }
}

export const liquidationSolver = LiquidationSolver.getSolver()