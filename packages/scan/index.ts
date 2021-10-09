import { Service } from './app/service'
import dotenv from 'dotenv'
import { referralProcessor } from './app/processor/referralProcessor'

dotenv.config()

const businessProcessorMap = {
  referral: referralProcessor,
}

async function main() {
  const service = await Service.build({
    endpoint: process.env.PARALLEL_ENDPOINT || 'ws://localhost:9947',
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    blockNumber: parseInt(process.env.BLOCK_NUMBER || '0'),
    processor: businessProcessorMap[process.env.BUSINESS || 'referral'],
  })
  await service.run()
}

main().catch(console.error)
