import { Event } from '@polkadot/types/interfaces'
import { logger } from '../../../logger'

export default {
  staked: async (event: Event) => {
    const [who, amount] = event.data
    logger.debug(`Receive [Staked(${who}, ${amount})] event`)
  },
}
