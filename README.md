# code explain

1. UserStorageData 合约用来记录添加 Liquidity 的细节
2. 分别用了 V3_SWAP_QUOTER 和 AlphaRouter 来获取 swap 价格
3. 自己写的 SingleSwapToken 合约，进行 swap 不成功
4. 用主网的 SwapRouter 进行 swap 不成功
5. 用 AlphaRouter 进行 swap 不成功
6. scripts 中，03_deployPools.js 不成功
7. 用 npx hard node 启动节点，节点上还没有部署usdc, usdt等主流代币，要用npm run fork启动

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
