import { Command } from 'commander'
import { Service } from './app/service'
import dotenv from 'dotenv';
import { referralProcessor } from './app/processor/referralProcessor'

interface Options {
  endpoint: string
  url: string
  blockNumber: string
  business: string
}

dotenv.config()

const program = new Command('parallel-scan')
program
  .version(process.env.VERSION || "0.0.1", '-v, --version', 'The parallel scanner version.')
  .option(
    '--endpoint <string>',
    'Parallel endpoint',
    process.env.PARALLEL_ENDPOINT || 'ws://localhost:9947'
  )
  .option('--url <string>', 'The mongodb url', 'mongodb://localhost:27017')
  .option(
    '-N, --block-number <number>',
    'The block number where we scan from',
    process.env.BLOCK_NUMBER || "0" // for referral, use 352453 to test crowdloan and referral
  )
  .option(
    '-B, --business <string>',
    'The business that this scanner support',
    process.env.BUSINESS || "referral"
  )

const businessProcessorMap = {
  referral: referralProcessor,
}

async function main() {
  program.parse()
  let options = program.opts<Options>()
  const service = await Service.build({
    endpoint: options.endpoint,
    url: options.url,
    blockNumber: parseInt(options.blockNumber),
    processor: businessProcessorMap[options.business],
  })
  await service.run()
}

main().catch(console.error)
