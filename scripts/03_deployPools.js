require("dotenv").config();

// Token addresses
shoaibAddress = process.env.shoaibAddress;
rayyanAddrss = process.env.rayyanAddrss;
popUpAddress = process.env.popUpAddress;

// Uniswap contract address
wethAddress = process.env.wethAddress;
factoryAddress = process.env.factoryAddress;
swapRouterAddress = process.env.swapRouterAddress;
nftDescriptorAddress = process.env.nftDescriptorAddress;
positionDescriptorAddress = process.env.positionDescriptorAddress;
positionManagerAddress = process.env.positionManagerAddress;

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

// const { waffle } = require("hardhat");
const { Contract, BigNumber } = require("ethers");
const fs = require("fs");
const bn = require("bignumber.js");
const { promisify } = require("util");
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
  let addresses = [`\nSHO_RAY=${shoRay}`];
  const data = "\n" + addresses.join("\n");
  const writeFile = promisify(fs.appendFile);
  const filePath = ".env";
  return writeFile(filePath, data)
    .then(() => {
      console.log("Addresses recorded.");
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
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
