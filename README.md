# start app

1. npm run fork:dev
2. npx hardhat run --network localhost scripts/mainnetContract/swapTokenMainnet.js

# code explain

1. node version: 18.12.1
2. If npm install fails, delete package-lock.json, delete yarn.lock, run npm cache clean --force, and then retry.

# files to exclude

.next,package.json,package-lock.json,artifacts,cache

# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
