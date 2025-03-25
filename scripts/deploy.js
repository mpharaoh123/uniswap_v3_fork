const hre = require("hardhat");

async function main() {

  const gasPrice = await hre.ethers.provider.getGasPrice();
  const maxFeePerGas = gasPrice.mul(2); 
  const maxPriorityFeePerGas = gasPrice;
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

// npx hardhat run --network localhost scripts/deploy.js

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
