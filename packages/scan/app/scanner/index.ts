import { BlockHash, Call, Event, EventRecord } from '@polkadot/types/interfaces'
import { Auction } from 'app/model/auction'
import { store } from 'app/store'
import { api } from '../api'

class Scanner {
  async processBlock(hash: BlockHash, height: number) {
    const events = await api.query.system.events.at(hash)
    const { block } = await api.rpc.chain.getBlock(hash)

    await Promise.all([
      block.extrinsics.map(async (ex, index) => {
        const filteredEvent = events.filter(
          ({ phase }) =>
            phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
        )

        if (api.tx.utility.batchAll.is(ex)) {
          let event: EventRecord | undefined
          // Ensure success
          event = filteredEvent.find(({ event }) =>
            api.events.system.ExtrinsicSuccess.is(event)
          )
          if (!event) return

          event = filteredEvent.find(({ event }) => {
            api.events.crowdloan.Contributed.is(event)
          })
          if (!event) return
          const [who0, index0, value] = event.event.data.map((e) =>
            e.toString()
          )

          event = filteredEvent.find(({ event }) => {
            api.events.crowdloan.MemoUpdated.is(event)
          })
          if (!event) return
          const [who1, index1, memo] = event.event.data.map((e) => e.toString())

          if (who0 !== who1 || index0 !== index1 || parseInt(index0) !== 2085)
            return

          let record: Auction = {
            blockHeight: height,
            amount: parseInt(value),
            account: who0,
            referralCode: memo,
            extrinsicHash: ex.hash.toHex(),
          }
          await store.getCols('auction').insertOne(record)
        }
      }),
    ])
  }
}

export const scanner = new Scanner()
