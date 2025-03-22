1. 自己写的SingleSwapToken合约，用到了主网的SwapRouter，SingleSwapToken合约主要构造了方法所需要的param
2. UserStorageData合约用来记录添加Liquidity的细节
3. 分别用了V3_SWAP_QUOTER和AlphaRouter来获取swap价格
4. 用主网的SwapRouter进行swap不成功
5. 用AlphaRouter进行swap不成功
6. addLiquidity见uniswap_v3_fork_script项目
# todo
1. 用SingleSwapToken合约实现swap

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
