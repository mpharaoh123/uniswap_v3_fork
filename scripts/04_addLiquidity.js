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

SHO_RAY = process.env.SHO_RAY;

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
  const [signer] = await ethers.getSigners();
  const provider = ethers.provider;


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

  const balance0 = await ShoaibContract.balanceOf(signer.address);
  const balance1 = await RayyanContract.balanceOf(signer.address);

  console.log(`Balance of Shoaib:`, balance0.toString());
  console.log(`Balance of Rayyan:`, balance1.toString());

  await ShoaibContract.connect(signer).approve(
    positionManagerAddress,
    ethers.utils.parseEther("1000")
  );
  await RayyanContract.connect(signer).approve(
    positionManagerAddress,
    ethers.utils.parseEther("1000")
  );

  const poolContract = new Contract(
    SHO_RAY,
    artifacts.UniswapV3Pool.abi,
    provider
  );

  const poolData = await getPoolData(poolContract);
  console.log("poolData", poolData);

  const ShoaibToken = new Token(31337, shoaibAddress, 18, "Shoaib", "SHO");
  const RayyanToken = new Token(31337, rayyanAddrss, 18, "Rayyan", "RAY");

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
    liquidity: ethers.utils.parseEther("1"),
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
  });
  // console.log(position);
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
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  };

  const nonfungiblePositionManager = new Contract(
    positionManagerAddress,
    artifacts.NonfungiblePositionManager.abi,
    provider
  );

  console.log(111, params);
  

  const tx = await nonfungiblePositionManager
    .connect(signer)
    .mint(params, { gasLimit: "1000000" });
  const receipt = await tx.wait();
  // console.log(receipt);
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
