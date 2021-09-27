# parallel-scan

Define the scanner for parallel.

The scanner will scan the blocks in the given chain to get all the data need.

## Build docker image

```
yarn make-image
```

## Referral Scanner

Scanner the parachain to find the contribution and referral information to calculate the bonus.
The scanner will scan the data and save them to the `MongoDB`;

### Scanner
Go to the packages/scan directory.
use `yarn dev:db` to pin up the mongodb using docker.
run `yarn start` to run the scanner.

If you are going to use local chain, change the endpoint to `ws://localhost:9947` or the right endpoint.
Or you could use the testnet to simplify the usage: `wss://testnet-relay-rpc.parallel.fi`.

You could set the block height to start from given height to process the event easier.
The scanner will continue at where you stopped. So please remember to clear the database if you want to run it again.

