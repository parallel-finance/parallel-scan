import { Operator } from '../../../types'
import { Event } from '@polkadot/types/interfaces'

export default {
  staked: async (event: Event, operator: Operator) => {
    const [who, amount] = event.data
  },
}
