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

SHO_RAY = "0xdf609F128Be22b7f0A326B4b8475A25467D60074";

const artifacts = {
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Shoaib: require("../artifacts/contracts/Shoaib.sol/Shoaib.json"),
  Rayyan: require("../artifacts/contracts/Rayyan.sol/Rayyan.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};

const { Contract } = require("ethers");
const { Token } = require("@uniswap/sdk-core");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");

async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

async function main() {
  const MAINNET_URL = "https://rpc.ankr.com/eth";
  const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);
  const [_owner, signer] = await ethers.getSigners();

  const ShoaibContract = new Contract(
    shoaibAddress,
    artifacts.Shoaib.abi,
    provider
  );

  const RayyanContract = new Contract(
    rayyanAddrss,
    artifacts.Rayyan.abi,
    provider
  );

  await ShoaibContract.connect(signer).approve(
    positionManagerAddress,
    ethers.utils.parseEther("599900")
  );
  await RayyanContract.connect(signer).approve(
    positionManagerAddress,
    ethers.utils.parseEther("599900")
  );

  const poolContract = new Contract(
    SHO_RAY,
    artifacts.UniswapV3Pool.abi,
    provider
  );

  console.log("getPoolData", getPoolData);
  const poolData = await getPoolData(poolContract);
  console.log("poolData", poolData);

  const ShoaibToken = new Token(5, shoaibAddress, 18, "Shoaib", "SHO");
  const RayyanToken = new Token(5, rayyanAddrss, 18, "Rayyan", "RAY");

  const pool = new Pool(
    ShoaibToken,
    RayyanToken,
    poolData.fee,
    poolData.sqrtPriceX96.toString(),
    poolData.liquidity.toString(),
    poolData.tick
  );

  const position = new Position({
    pool: pool,
    liquidity: ethers.utils.parseUnits("2000", 18).toString(),
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
  });
  console.log(position);
  const { amount0: amount0Desired, amount1: amount1Desired } =
    position.mintAmounts;

  params = {
    token0: shoaibAddress,
    token1: rayyanAddrss,
    fee: poolData.fee,
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: amount0Desired.toString(),
    amount1Min: amount1Desired.toString(),
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  };

  const nonfungiblePositionManager = new Contract(
    positionManagerAddress,
    artifacts.NonfungiblePositionManager.abi,
    provider
  );

  const tx = await nonfungiblePositionManager
    .connect(signer)
    .mint(params, { gasLimit: "1000000" });
  const receipt = await tx.wait();
  console.log(receipt);
}

/*
  npx hardhat run --network localhost scripts/04_addLiquidity.js
  */

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
