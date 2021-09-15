import { Command } from 'commander'
import { Service } from './app/service'

interface Options {
  endpoint: string
  url: string
  initBlockNumber: number
}

const program = new Command('parallel-scan')
program
  .version('0.0.1', '-v, --version', 'The parallel scanner version.')
  .option('--endpoint <string>', 'Parallel endpoint', 'ws://localhost:9947')
  .option('--url <string>', 'The mongodb url', 'mongodb://localhost:27017')
  .option(
    '-n, --init-block-number <number>',
    'The block number where scanning from',
    '0'
  )

async function main() {
  program.parse()
  let options = program.opts<Options>()
  const service = await Service.build(options)
  await service.run()
}

main().catch(console.error)
