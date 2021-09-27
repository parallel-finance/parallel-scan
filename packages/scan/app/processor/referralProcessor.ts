import { BlockHash, EventRecord } from '@polkadot/types/interfaces'
import { Store } from '../store'
import { ApiPromise } from '@polkadot/api'
import { Logger } from 'winston'
import { Crowdloan } from '../model/crowdloan'
import { Collections } from '../model'
import { Vec } from '@polkadot/types'
import { Moment, SignedBlock } from '@polkadot/types/interfaces/runtime'

export const referralProcessor =
  (store: Store, api: ApiPromise, logger: Logger) =>
  async (hash: BlockHash, height: number): Promise<void> => {
    logger.debug(`start processing block`)
    const events: Vec<EventRecord> = await api.query.system.events.at(hash)
    logger.debug(`get block`)
    const { block }: SignedBlock = await api.rpc.chain.getBlock(hash)
    // logger.debug(`block: ${JSON.stringify(block.toHuman())}`)
    logger.debug(`get timestamp`)
    const timestamp: Moment = await api.query.timestamp.now.at(hash)
    await Promise.all([block.extrinsics.map(async (ex, index) => {
      const extrinsicEvents = events.filter(
        ({ phase, event }) =>
          phase.isApplyExtrinsic &&
          phase.asApplyExtrinsic.eq(index)
      )
      const crowdloanExtrinsicEvents = extrinsicEvents.filter(({ event }) => event.section === 'crowdloan')
      const extrinsicSuccessEvent = extrinsicEvents.find(({ event }) => api.events.system.ExtrinsicSuccess.is(event))
      if (!extrinsicSuccessEvent) {
        return
      }

      const contributedEvent = crowdloanExtrinsicEvents.find(
        ({ event }) => event.method === 'Contributed'
      )
      if (!contributedEvent) {
        return
      }
      const memoUpdatedEvent = crowdloanExtrinsicEvents.find(
        ({ event }) => event.method === 'MemoUpdated'
      )
      const [contributeAccount, contributeParaId, value] = contributedEvent.event.data.map(x => x.toString())
      const [memoAccount, memoParaId, memo] = memoUpdatedEvent ? memoUpdatedEvent.event.data.map(x => x.toString()) : [];
      if (memoUpdatedEvent && (contributeAccount !== memoAccount || contributeParaId !== memoParaId)) {
        return
      }
      const record: Crowdloan = {
        blockHeight: height,
        amount: parseInt(value),
        account: contributeAccount,
        referralCode: memo,
        paraId: parseInt(contributeParaId),
        extrinsicHash: ex.hash.toHex(),
        timestamp: timestamp.toString(),
      }
      logger.debug(`record: ${JSON.stringify(record)}`);
      await store.getCols(Collections.crowdloan).insertOne(record)
    })])
  }
