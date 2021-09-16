import { ApiPromise } from '@polkadot/api';
import type { u8 } from '@polkadot/types';
import '@parallel-finance/types';
import { AccountId, CurrencyId, Liquidity, Shortfall, TimestampedValue, Deposits } from '@parallel-finance/types/interfaces';
import * as _ from 'lodash';
import { BN } from '@polkadot/util';
import { KeyringPair } from '@polkadot/keyring/types';
import { logger } from '../../../app/logger';

const BN1E18 = new BN('1000000000000000000');
const BN1E6 = new BN('1000000');

type LiquidationParam = {
    borrower: AccountId;
    liquidateToken: CurrencyId;
    collateralToken: CurrencyId;
    repay: BN;
};

type OraclePrice = {
  currencyId: string;
  price: BN;
  decimal: u8;
};

class LiquidationSolver {
    private shortfallBorrowers
    private liquidationParams

    constructor() {

    }
    
    public async liquidate(api: ApiPromise, blockNumber: number) {
      logger.debug(`Liquidate block#${blockNumber}`)
      const liquidationParams = await this.calcLiquidationParams(api);
      this.liquidationParams = liquidationParams;
      if (!liquidationParams) {
        logger.debug(`liquidationParams: ${liquidationParams}`)
      } else {
        logger.debug(`liquidationParams: None`)
      }
    }
    
    async scanShortfallBorrowers(api: ApiPromise): Promise<Array<AccountId>> {
        // console.debug('scan shortfall borrowers');

        const borrowerKeys = await api.query.loans.accountBorrows.keys();
        let borrowers = borrowerKeys.map(({ args: [_, accountId] }) => {
          return accountId;
        });
        borrowers = _.uniqWith(borrowers, _.isEqual);
      
        const asyncFilter = async (arr: Array<AccountId>, predicate: (a: AccountId) => Promise<boolean>) => {
          const results = await Promise.all(arr.map(predicate));
          return arr.filter((_v, index) => results[index]);
        };

        return await asyncFilter(borrowers, async (accountId) => {
          const accountLiquidity: [Liquidity, Shortfall] = await api.rpc.loans.getAccountLiquidity(accountId, null);
          // console.log("borrower", accountId.toHuman(), "shortfall", accountLiquidity[1].toHuman());
          console.log(
            "borrower", accountId.toHuman(), 
            "liquidity", accountLiquidity[0].toHuman(),
            "shortfall", accountLiquidity[1].toHuman()
          );

          return !accountLiquidity[1].toBn().isZero();
        });
    }

    async liquidateBorrow(api: ApiPromise, signer: KeyringPair) {
    const liquidationParams = await this.calcLiquidationParams(api);
    liquidationParams.forEach((param) => {
      console.log('borrower', param!.borrower.toHuman());
      console.log('liquidateToken', param!.liquidateToken.toHuman());
      console.log('collateralToken', param!.collateralToken.toHuman());
      console.log('repay', param!.repay.toString());
    });
  
      await Promise.all(
        liquidationParams.map(async (param) => {
          await api.tx.loans
          .liquidateBorrow(param!.borrower, param!.liquidateToken, param!.repay, param!.collateralToken)
          .signAndSend(signer);
        })
      );
    }

    async calcLiquidationParams(api: ApiPromise) {
        const shortfallBorrowers = await this.scanShortfallBorrowers(api);
        this.shortfallBorrowers = shortfallBorrowers
        if (shortfallBorrowers.length) {
          console.log('shortfallBorrowers count', shortfallBorrowers.length);
          console.log('shortfallBorrowers', shortfallBorrowers)
        }
      
        return await Promise.all(
          shortfallBorrowers.map(async (accountId) => {
            return await this.calcLiquidationParam(api, accountId);
          })
        );
    }
    
    async calcLiquidationParam(api: ApiPromise, accountId: AccountId): Promise<LiquidationParam | undefined> {
        const markets = await api.query.loans.markets.entries();
        if (markets.length == 0) {
          await Promise.reject(new Error('no markets'));
        }
      
        const prices = await this.getOraclePrices(api);
        // console.log('prices', JSON.stringify(prices));
      
        // TODO: filter the active markets
        const collateralMiscList = await Promise.all(
          markets.map(async ([key, market], a, c) => {
            const [currencyId] = key.args;
            const exchangeRate = await api.query.loans.exchangeRate(currencyId);
            const price = this.getUnitPrice(prices, currencyId);
            const deposit: Deposits = await api.query.loans.accountDeposits(currencyId, accountId);
            let value = new BN(0);
            if (deposit.isCollateral.isTrue) {
              value = deposit.voucherBalance.toBn().mul(price).div(BN1E18).mul(exchangeRate.toBn()).div(BN1E18);
            }
            return {
              currencyId,
              value,
              market: market.unwrapOrDefault()
            };
          })
        );
      
        const debitMiscList = await Promise.all(
          markets.map(async ([key, market]) => {
            const [currencyId] = key.args;
            const snapshot = await api.query.loans.accountBorrows(currencyId, accountId);
            const borrowIndex = await api.query.loans.borrowIndex(currencyId);
            const price = this.getUnitPrice(prices, currencyId);
      
            let assetValue = new BN(0);
            if (!snapshot.borrowIndex.isZero()) {
              assetValue = borrowIndex.div(snapshot.borrowIndex.toBn()).mul(snapshot.principal).mul(price).div(BN1E18);
            }
            return {
              currencyId,
              value: assetValue,
              market: market.unwrapOrDefault()
            };
          })
        );
      
        // const liquidity: [Liquidity, Shortfall] = await api.rpc.loans.getAccountLiquidity(accountId, null);
        const bestCollateral = _.maxBy(collateralMiscList, (misc) => misc.value.toBuffer());
        // console.log('bestCollateral', JSON.stringify(bestCollateral));
        const bestDebt = _.maxBy(debitMiscList, (misc) => misc.value.toBuffer());
        // console.log('bestDebt', JSON.stringify(bestDebt));
        const repayValue = BN.min(
          bestCollateral!.value.mul(new BN(BN1E18)).div(bestCollateral!.market.liquidateIncentive.toBn()),
          bestDebt!.value.mul(bestDebt!.market.closeFactor.toBn()).div(BN1E6)
        );
        
        const debtPrice = this.getUnitPrice(prices, bestDebt!.currencyId);
        const repay = repayValue.mul(BN1E18).div(debtPrice);
        
        return {
          borrower: accountId,
          liquidateToken: bestDebt!.currencyId,
          collateralToken: bestCollateral!.currencyId,
          repay
        };
    }

    async getOraclePrices(api: ApiPromise): Promise<Array<OraclePrice>> {
      const marketKeys = await api.query.loans.markets.keys();
      if (marketKeys.length == 0) {
        await Promise.reject(new Error('no markets'));
      }
    
      return await Promise.all(
        marketKeys.map(async ({ args: [currencyId] }) => {
          const price = await api.rpc.oracle.getValue('Aggregated', currencyId);
          const parallelPrice = price.unwrapOrDefault() as unknown as TimestampedValue;
          return {
            currencyId: currencyId.toString(),
            price: parallelPrice.value.price.toBn(),
            decimal: parallelPrice.value.decimal
          };
        })
      );
    }

    getUnitPrice(prices: Array<OraclePrice>, currencyId: CurrencyId): BN {
      const oraclePrice = _.find(prices, { currencyId: currencyId.toString() });
        return oraclePrice!.price.mul(BN1E18).div(new BN(10 ** + oraclePrice!.decimal));
    }
}

export const liquidationSolver = new LiquidationSolver()
