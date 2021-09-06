import { Command } from "commander";

interface Options {
  endpoint: string;
  url: string;
  port: string;
}

const program = new Command("parallel-scan");
program
  .version("0.0.1", "-v, --version", "The parallel scanner version.")
  .option(
    "--endpoint <string>",
    "Parallel endpoint",
    "wss://testnet.parallel.fi"
  )
  .option("--url <string>", "The mongodb url")
  .option("--port <string>", "The mongodb port mongodb");

async function main() {
  program.parse();
  let options = program.opts<Options>();
}

main().catch(console.error);
