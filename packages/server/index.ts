import express from 'express'
let query = {}
import { buildSchema } from 'graphql'
import { graphqlHTTP } from 'express-graphql'
import { Command } from 'commander'
import { MongoClient } from 'mongodb'

const program = new Command('parallel-scan-server')
program
  .version('0.0.1', '-v, --version', 'The parallel scanner version')
  .option('--url <string>', 'The mongodb url', 'mongodb://localhost:27017')

const schema = buildSchema(`
  type Query {
    contributions: [Contribution]
    blockInfos: [BlockInfo]
    hello: String
  }

  type Contribution {
    blockHeight: Int,
    account: String,
    amount: Int,
    referralCode: String,
    extrinsicHash: String
  }

  type BlockInfo {
    blockHeight: Int,
    hash: String
  }
`)

async function main() {
  const app = express()

  program.parse()
  let options = program.opts()
  const client = new MongoClient(options.url)
  await client.connect()
  const db = client.db('parallel-scan')

  let rootValue = {
    contributions: async () => {
      return await db.collection('auction').find({}).toArray()
    },
    blockInfos: async () => {
      return await db.collection('blockInfo').find({}).toArray()
    },
    hello: () => 'Hello world',
  }

  app.use(
    '/graphql',
    graphqlHTTP({
      schema,
      rootValue,
      graphiql: true,
    })
  )
  app.listen(4000)
}

main()
