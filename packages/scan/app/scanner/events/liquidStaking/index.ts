import { Event } from '@polkadot/types/interfaces'
import { store } from '../../../store'
import { logger } from '../../../logger'

export default {
  staked: async (event: Event, height: number) => {
    const [who, amount] = event.data.map((e) => e.toString())
    logger.debug(`Receive [Staked(${who}, ${amount})] event`)
    const lastRecordOrDefault = (await store.getNewestRecordOf('staker')) || {
      blockHeight: height,
      stakers: {
        who: parseInt(amount),
      },
    }

    // update stakers field
    const stakers = lastRecordOrDefault.stakers
    stakers[who] = parseInt(amount) + (stakers[who] || 0)

    await store.getCols('staker').updateOne(
      { blockHeight: height },
      {
        $set: {
          blockHeight: height,
          stakers,
        },
      }
    )
  },
}
