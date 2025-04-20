# code explain

0. node version: 18.12.1
1. npm i 失败的话，del package-lock.json, del yarn.lock, npm cache clean --force，重试
2. 分别用了 V3_SWAP_QUOTER 和 AlphaRouter 来获取 swap 价格
3. 用 AlphaRouter 进行 swap 不成功
4. 不能用 npx hard node 启动节点，节点上还没有部署 usdc, usdt 等主流代币，要用 npm run fork 启动

# scripts command

npx hardhat run --network localhost scripts/01_deployContracts.js
npx hardhat run --network localhost scripts/02_deployTokens.js
npx hardhat run --network localhost scripts/03_deployPools.js
npx hardhat run --network localhost scripts/04_addLiquidity.js

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
