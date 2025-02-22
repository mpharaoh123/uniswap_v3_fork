// Token addresses
shoaibAddress= '0xf4fa0d1C10c47cDe9F65D56c3eC977CbEb13449A'
rayyanAddrss= '0xA343B1FC2897b8C49A72A9A0B2675cB9c7664e8c'
popUpAddress= '0x88B9Ad010A699Cc0c8C5C5EA8bAF90A0C375df1a'

// Uniswap contract address
wethAddress= '0xf975A646FCa589Be9fc4E0C28ea426A75645fB1f'
factoryAddress= '0xAaC7D4A36DAb95955ef3c641c23F1fA46416CF71'
swapRouterAddress= '0x6B5CF024365D5d5d0786673780CA7E3F07f85B63'
nftDescriptorAddress= '0x594f79e85F6f041eb56cF6822FF4125ee316409E'
positionDescriptorAddress= '0xfDb6669cF60C1dBfB0f72Ea50A6eC5e0FD6089E1'
positionManagerAddress= '0x2fe19128A8257182fdD77f90eA96D27cA342897A'

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
  // const [owner] = await ethers.getSigners();
  const MAINNET_URL = "test network url";

  const WALLET_ADDRESS = "your";
  const WALLET_SECRET = "your";
  const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);
  const wallet = new ethers.Wallet(WALLET_SECRET);
  const signer = wallet.connect(provider);
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
  npx hardhat run --network goerli scripts/deployPool.js
  */

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
