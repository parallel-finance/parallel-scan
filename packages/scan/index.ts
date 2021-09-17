import { Command } from 'commander'
import { Service } from './app/service'

interface Options {
  endpoint: string
  url: string
  blockNumber: string
}

const program = new Command('parallel-scan')
program
  .version('0.0.1', '-v, --version', 'The parallel scanner version.')
  .option('--endpoint <string>', 'Parallel endpoint', 'ws://localhost:9947')
  .option('--url <string>', 'The mongodb url', 'mongodb://localhost:27017')
  .option(
    '-N, --block-number <number>',
    'The block number where we scan from',
    '0'
  )

async function main() {
  program.parse()
  let options = program.opts<Options>()
  const service = await Service.build({
    endpoint: options.endpoint,
    url: options.url,
    blockNumber: parseInt(options.blockNumber),
  })
  await service.run()
}

main().catch(console.error)
