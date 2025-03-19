// Token addresses
shoaibAddress= '0x0B32a3F8f5b7E5d315b9E52E640a49A89d89c820'
rayyanAddrss= '0xF357118EBd576f3C812c7875B1A1651a7f140E9C'
popUpAddress= '0x519b05b3655F4b89731B677d64CEcf761f4076f6'

// Uniswap contract address
wethAddress= '0xEb0fCBB68Ca7Ba175Dc1D3dABFD618e7a3F582F6'
factoryAddress= '0xaE2abbDE6c9829141675fA0A629a675badbb0d9F'
swapRouterAddress= '0x8B342f4Ddcc71Af65e4D2dA9CD00cc0E945cFD12'
nftDescriptorAddress= '0xE2307e3710d108ceC7a4722a020a050681c835b3'
positionDescriptorAddress= '0xD28F3246f047Efd4059B24FA1fa587eD9fa3e77F'
positionManagerAddress= '0x15F2ea83eB97ede71d84Bd04fFF29444f6b7cd52'

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
