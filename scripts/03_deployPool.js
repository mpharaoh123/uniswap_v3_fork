// Token addresses
shoaibAddress = "0xDf66AB853Fc112Ec955531bd76E9079db30A0e27";
rayyanAddrss = "0x8797847c9d63D8Ed9C30B058F408d4257A33B76C";
popUpAddress = "0xF816b7FfDa4a8aB6B68540D1993fCa98E462b3bc";

// Uniswap contract address
wethAddress = "0x1E53bea57Dd5dDa7bFf1a1180a2f64a5c9e222f5";
factoryAddress = "0x27f7785b17c6B4d034094a1B16Bc928bD697f386";
swapRouterAddress = "0x17f4B55A352Be71CC03856765Ad04147119Aa09B";
nftDescriptorAddress = "0x08677Af0A7F54fE2a190bb1F75DE682fe596317e";
positionDescriptorAddress = "0xa7480B62a657555f6727bCdb96953bCC211FFbaC";
positionManagerAddress = "0x87a2688d6E41b23d802F74c6B1F06a8e8d118929";

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

// const { waffle } = require("hardhat");
const { Contract, BigNumber } = require("ethers");
const bn = require("bignumber.js");
const Web3Modal = require("web3modal");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const MAINNET_URL =
  "://eth-mainnet.alchemyapi.io/v2/1Dtrq8-CWOYN2T7S8x2GuNOapwh5jq9f";
// const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);
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
  npx hardhat run --network localhost scripts/03_deployPool.js
  */

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
