const hre = require("hardhat");

async function main() {
  //ERC20 BOO TOKEN
  // const BooToken = await hre.ethers.getContractFactory("BooToken");
  // const booToken = await BooToken.deploy();
  // await booToken.deployed();
  // console.log(`BOO deployed to ${booToken.address}`);

  //ERC20 LIFE TOKEN
  // const LifeToken = await hre.ethers.getContractFactory("LifeToken");
  // const lifeToken = await LifeToken.deploy();
  // await lifeToken.deployed();
  // console.log(`LIfe deployed to ${lifeToken.address}`);

  const gasPrice = await hre.ethers.provider.getGasPrice();
  const maxFeePerGas = gasPrice.mul(2); // 将燃气费翻倍
  const maxPriorityFeePerGas = gasPrice; // 设置最大优先级燃气费

  //SingleSwapToken
  const SingleSwapToken = await hre.ethers.getContractFactory(
    "SingleSwapToken"
  );
  const singleSwapToken = await SingleSwapToken.deploy();
  await singleSwapToken.deployed({ maxFeePerGas, maxPriorityFeePerGas }); 
  console.log(`SingleSwapToken deployed to ${singleSwapToken.address}`);

  //SwapMultiHop
  const SwapMultiHop = await hre.ethers.getContractFactory("SwapMultiHop");
  const swapMultiHop = await SwapMultiHop.deploy();
  await swapMultiHop.deployed({ maxFeePerGas, maxPriorityFeePerGas });
  console.log(`swapMultiHop deployed to ${swapMultiHop.address}`);

  //USER DATA CONTRACT
  const UserStorageData = await hre.ethers.getContractFactory(
    "UserStorageData"
  );
  const userStorageData = await UserStorageData.deploy();
  await userStorageData.deployed({ maxFeePerGas, maxPriorityFeePerGas });
  console.log(`UserStorageData deployed to ${userStorageData.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
