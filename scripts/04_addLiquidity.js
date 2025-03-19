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

SHO_RAY = "0xBaDa34457C2925dE8133a3a852C2360f956f33e3";

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
  const [_owner, signer] = await ethers.getSigners();
  const provider = waffle.provider;

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

  console.log("getPoolData", getPoolData);
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
