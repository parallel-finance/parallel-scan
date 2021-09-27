import { BlockHash, EventRecord } from '@polkadot/types/interfaces'
import { Store } from '../store'
import { ApiPromise } from '@polkadot/api'
import { Logger } from 'winston'
import { Crowdloan } from '../model/crowdloan'
import { Collections } from '../model'

export const referralProcessor =
  (store: Store, api: ApiPromise, logger: Logger) =>
  async (hash: BlockHash, height: number): Promise<void> => {
    logger.debug(`start processing block`)
    const events = await api.query.system.events.at(hash)
    logger.debug(`get block`)
    const { block } = await api.rpc.chain.getBlock(hash)
    logger.debug(`get timestamp`)
    const timestamp = await api.query.timestamp.now.at(hash)

    await Promise.all([
      block.extrinsics.map(async (ex, index) => {
        logger.debug(`process extrinsic: ${index}`)
        const filteredEvent = events.filter(
          ({ phase }) =>
            phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
        )

        if (api.tx.utility.batchAll.is(ex)) {
          logger.debug('Find batchAll extrinsic')
          let event: EventRecord | undefined
          // Ensure success
          event = filteredEvent.find(({ event }) =>
            api.events.system.ExtrinsicSuccess.is(event)
          )
          if (!event) return

          event = filteredEvent.find(
            ({ event }) =>
              event.section === 'crowdloan' && event.method === 'Contributed'
            /* api.events.crowdloan.Contributed.is(event) */
          )
          if (!event) return
          const [who0, index0, value] = event.event.data.map((e) =>
            e.toString()
          )
          logger.debug(`${who0} contributed ${value} for Parachain#${index0}`)

          event = filteredEvent.find(
            ({ event }) =>
              event.section === 'crowdloan' && event.method === 'MemoUpdated'
            /* api.events.crowdloan.MemoUpdated.is(event) */
          )
          if (!event) return
          const [who1, index1, memo] = event.event.data.map((e) => e.toString())
          logger.debug(`${who1} marked ${memo}`)

          const paraId = parseInt(index0)
          if (who0 !== who1 || index0 !== index1 || paraId !== 2085) return

          let record: Crowdloan = {
            blockHeight: height,
            amount: parseInt(value),
            account: who0,
            referralCode: memo,
            paraId,
            extrinsicHash: ex.hash.toHex(),
            timestamp: timestamp.toString(),
          }
          logger.debug(`save crowdloan: ${index}`)
          await store.getCols(Collections.crowdloan).insertOne(record)
          logger.debug(`crowdloan saved: ${index}`)
        }
      }),
    ])
  }
