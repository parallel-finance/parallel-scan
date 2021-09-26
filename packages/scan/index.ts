import { Command } from 'commander'
import { Service } from './app/service'
import { referralProcessor } from './app/processor/referralProcessor'

interface Options {
  endpoint: string
  url: string
  blockNumber: string
  business: string
}

const program = new Command('parallel-scan')
program
  .version('0.0.1', '-v, --version', 'The parallel scanner version.')
  .option(
    '--endpoint <string>',
    'Parallel endpoint',
    'wss://testnet-relay-rpc.parallel.fi'
  )
  .option('--url <string>', 'The mongodb url', 'mongodb://localhost:27017')
  .option(
    '-N, --block-number <number>',
    'The block number where we scan from',
    '0' // for referral, use 310959 to test
  )
  .option(
    '-B, --business <string>',
    'The business that this scanner support',
    'referral'
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
