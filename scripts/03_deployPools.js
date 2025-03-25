// Token addresses
shoaibAddress= '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1'
rayyanAddrss= '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE'
popUpAddress= '0x68B1D87F95878fE05B998F19b66F4baba5De1aed'

// Uniswap contract address
wethAddress= '0x5FbDB2315678afecb367f032d93F642f64180aa3'
factoryAddress= '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
swapRouterAddress= '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
nftDescriptorAddress= '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
positionDescriptorAddress= '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
positionManagerAddress= '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

// const { waffle } = require("hardhat");
const { Contract, BigNumber } = require("ethers");
const bn = require("bignumber.js");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const provider = ethers.provider;

function encodePriceSqrt(reserve1, reserve0) {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  );
}

const nonfungiblePositionManager = new Contract(
  positionManagerAddress,
  artifacts.NonfungiblePositionManager.abi,
  provider
);

const factory = new Contract(
  factoryAddress,
  artifacts.UniswapV3Factory.abi,
  provider
);

async function deployPool(token0, token1, fee, price) {
  const [signer] = await ethers.getSigners();

  if (token0.toLowerCase() > token1.toLowerCase()) {
    token0 = token1;
    token1 = token0;
  }
  const create = await nonfungiblePositionManager
    .connect(signer)
    .createAndInitializePoolIfNecessary(token0, token1, fee, price, {
      gasLimit: 5000000,
    });

  console.log("create", create);
  await create.wait();

  console.log("Fetching pool address...");
  const poolAddress = await factory
    .connect(signer)
    .getPool(token0, token1, fee);
  return poolAddress;
}

async function main() {
  const shoRay = await deployPool(
    popUpAddress,
    rayyanAddrss,
    500,
    encodePriceSqrt(1, 1)
  );

  console.log("\nSHO_RAY=", `'${shoRay}'`);
}

/*
  npx hardhat run --network localhost scripts/03_deployPools.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
