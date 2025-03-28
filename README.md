1. 自己写的 SingleSwapToken 合约，用到了主网的 SwapRouter，SingleSwapToken 合约主要构造了方法所需要的 param
2. UserStorageData 合约用来记录添加 Liquidity 的细节
3. 分别用了 V3_SWAP_QUOTER 和 AlphaRouter 来获取 swap 价格
4. 用主网的 SwapRouter 进行 swap 不成功
5. 用 AlphaRouter 进行 swap 不成功
6. addLiquidity 见 uniswap_v3_fork_script 项目
7. scripts中，03_deployPools.js不成功

# todo

1. 用 SingleSwapToken 合约实现 swap

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
