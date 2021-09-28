import { Block, BlockHash, EventRecord } from '@polkadot/types/interfaces'
import { Store } from '../store'
import { ApiPromise } from '@polkadot/api'
import { Logger } from 'winston'
import { Crowdloan } from '../model/crowdloan'
import { Collections } from '../model'
import { GenericExtrinsic, Vec } from '@polkadot/types'
import { Moment, SignedBlock } from '@polkadot/types/interfaces/runtime'
import { notEmpty } from '../utils'

const hasSucceededCrowdloanExtrinsic = (
  api: ApiPromise,
  events: Vec<EventRecord>
): boolean => {
  const contributedCrowdloanEvent = events.find(
    ({ event }) =>
      event.method === 'Contributed' && event.section === 'crowdloan'
  )
  if (!contributedCrowdloanEvent) {
    return false
  }
  const extrinsicSuccessEvent = events.find(({ event }) =>
    api.events.system.ExtrinsicSuccess.is(event)
  )
  if (!extrinsicSuccessEvent) {
    return false
  }
  return true
}

export const referralProcessor =
  (store: Store, api: ApiPromise, logger: Logger) =>
  async ({ blockHeight, hash }): Promise<void> => {
    logger.debug(`start processing block`)
    const events: Vec<EventRecord> = await api.query.system.events.at(hash)
    logger.debug(`checking block`)
    if (!hasSucceededCrowdloanExtrinsic(api, events)) {
      return
    }

    logger.debug(`get block`)
    const { block }: SignedBlock = await api.rpc.chain.getBlock(hash)
    // logger.debug(`block: ${JSON.stringify(block.toHuman())}`)
    logger.debug(`get timestamp`)
    const timestamp: Moment = await api.query.timestamp.now.at(hash)
    const crowdloans: Crowdloan[] = block.extrinsics
      .map((extrinsic: GenericExtrinsic, index: number) => {
        const extrinsicEvents = events.filter(
          ({ phase, event }) =>
            phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
        )
        const crowdloanExtrinsicEvents = extrinsicEvents.filter(
          ({ event }) => event.section === 'crowdloan'
        )
        const contributedEvent = crowdloanExtrinsicEvents.find(
          ({ event }) => event.method === 'Contributed'
        )
        const extrinsicSuccessEvent = extrinsicEvents.find(({ event }) =>
          api.events.system.ExtrinsicSuccess.is(event)
        )
        // Check again cause we need to make sure the extrinsicSuccessEvent is for the same extrinsic
        if (!extrinsicSuccessEvent || !contributedEvent) {
          return null
        }

        const memoUpdatedEvent = crowdloanExtrinsicEvents.find(
          ({ event }) => event.method === 'MemoUpdated'
        )
        const [contributeAccount, contributeParaId, value] =
          contributedEvent.event.data.map((x) => x.toString())
        const [memoAccount, memoParaId, memo] = memoUpdatedEvent
          ? memoUpdatedEvent.event.data.map((x) => x.toString())
          : []
        if (
          memoUpdatedEvent &&
          (contributeAccount !== memoAccount || contributeParaId !== memoParaId)
        ) {
          return null
        }
        const crowdloan: Crowdloan = {
          blockHeight: blockHeight,
          amount: parseInt(value),
          account: contributeAccount,
          referralCode: memo,
          paraId: parseInt(contributeParaId),
          extrinsicHash: extrinsic.hash.toHex(),
          timestamp: timestamp.toString(),
        }
        logger.debug(`record: ${JSON.stringify(crowdloan)}`)
        return crowdloan
      })
      .filter(notEmpty)
    await store.getCols(Collections.crowdloan).insertMany(crowdloans)
  }
