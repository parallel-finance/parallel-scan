import { Command } from 'commander'
import { Service } from 'app/service'

interface Options {
  endpoint: string
  url: string
}

const program = new Command('parallel-scan')
program
  .version('0.0.1', '-v, --version', 'The parallel scanner version.')
  .option(
    '--endpoint <string>',
    'Parallel endpoint',
    'wss://testnet.parallel.fi'
  )
  .option('--url <string>', 'The mongodb url')

async function main() {
  program.parse()
  let options = program.opts<Options>()
  let service = await Service.build(options)
  await service.run()
}

main().catch(console.error)
