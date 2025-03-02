// Token addresses
shoaibAddress= '0xABc84968376556B5e5B3C3bda750D091a06De536'
rayyanAddrss= '0xFf8FA9381caf61cB3368a6ec0b3F5C788028D0Cd'
popUpAddress= '0xE55cc27460B55c8aC7E73043F38b537758C9E51e'

// Uniswap contract address
wethAddress= '0x90A3B384F62f43Ba07938EA43aEEc35c2aBfeCa2'
factoryAddress= '0x43c5DF0c482c88Cef8005389F64c362eE720A5bC'
swapRouterAddress= '0x2098cb47B17082Ab6969FB2661f2759A9BF357c4'
nftDescriptorAddress= '0xF01f4567586c3A707EBEC87651320b2dd9F4A287'
positionDescriptorAddress= '0x2B07F89c9F574a890F5B8b7FddAfbBaE40f6Fde2'
positionManagerAddress= '0xCaC60200c1Cb424f2C1e438c7Ee1B98d487f0254'

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

// const { waffle } = require("hardhat");
const { Contract, BigNumber } = require("ethers");
const bn = require("bignumber.js");
const Web3Modal = require("web3modal");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const MAINNET_URL = "https://rpc.ankr.com/eth";
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);

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

  const create = await nonfungiblePositionManager
    .connect(signer)
    .createAndInitializePoolIfNecessary(token0, token1, fee, price, {
      gasLimit: 5000000,
    });

  console.log(create);
  const poolAddress = await factory
    .connect(signer)
    .getPool(token0, token1, fee);
  return poolAddress;
}

async function main() {
  const shoRay = await deployPool(
    popUpAddress,
    rayyanAddrss,
    3000,
    encodePriceSqrt(1, 1)
  );

  console.log("SHO_RAY=", `'${shoRay}'`);
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
