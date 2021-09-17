import { BlockHash, Call, Event, EventRecord } from '@polkadot/types/interfaces'
import { logger } from '../logger'
import { Auction } from '../model/auction'
import { store } from '../store'
import { api } from '../api'

class Scanner {
  async processBlock(hash: BlockHash, height: number) {
    const events = await api.query.system.events.at(hash)
    const { block } = await api.rpc.chain.getBlock(hash)
    const timestamp = await api.query.timestamp.now.at(hash)

    await Promise.all([
      block.extrinsics.map(async (ex, index) => {
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

          let record: Auction = {
            blockHeight: height,
            amount: parseInt(value),
            account: who0,
            referralCode: memo,
            paraId,
            extrinsicHash: ex.hash.toHex(),
            timestamp: timestamp.toString(),
          }
          await store.getCols('auction').insertOne(record)
        }
      }),
    ])
  }
}

export const scanner = new Scanner()
