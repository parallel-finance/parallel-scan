import { Command } from 'commander'
import { Service } from './app/service'

interface Options {
  endpoint: string
  url: string
}

const program = new Command('parallel-scan')
program
  .version('0.0.1', '-v, --version', 'The parallel scanner version.')
  .option('--endpoint <string>', 'Parallel endpoint', 'ws://localhost:9947')
  .option('--url <string>', 'The mongodb url', 'mongodb://localhost:27017')

async function main() {
  program.parse()
  let options = program.opts<Options>()
  const service = await Service.build(options)
  await service.run()
}

main().catch(console.error)
