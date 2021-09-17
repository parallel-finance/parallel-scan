import { ApiPromise } from '@polkadot/api';
import '@parallel-finance/types';
import { AccountId, Liquidity, Shortfall } from '@parallel-finance/types/interfaces';
import * as lds from 'lodash';
import { logger } from '../../../app/logger';

type ShortfallRecord = {
  borrower: AccountId;
  liquidity: Liquidity;
  shortfall: Shortfall;
  status: boolean;
}

class LiquidationSolver {
    private shorfallRecords
    
    public async liquidate(api: ApiPromise, blockNumber: number) {
      logger.debug(`Liquidate block#${blockNumber}`)

      const shorfallRecords = await this.accountsLiquidity(api);
      this.shorfallRecords = JSON.stringify(shorfallRecords);

      logger.debug(`shorfallRecords: ${shorfallRecords.length? this.shorfallRecords : "None" }`)
    }
    
    async accountsLiquidity(api: ApiPromise) {
      return await this.scanShortfallRecords(api); 
    }
    
    async scanShortfallRecords(api: ApiPromise): Promise<Array<ShortfallRecord>> {
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
          borrower: accountId,
          liquidity: accountLiquidity[0],
          shortfall: accountLiquidity[1],
          // Retrieve only non-zero shortfall
          status: !accountLiquidity[1].toBn().isZero()
        }

        return shorfallRecord
      });
    }
}

export let liquidationSolver: LiquidationSolver
