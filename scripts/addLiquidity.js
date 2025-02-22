// Token addresses
shoaibAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
rayyanAddrss = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
popUpAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";

SHO_RAY = "0xEED35b5e260d3Da1741B3967Ad15127A802a2d80";

// Uniswap contract address
wethAddress = "0xb6057e08a11da09a998985874FE2119e98dB3D5D";
factoryAddress = "0xad203b3144f8c09a20532957174fc0366291643c";
swapRouterAddress = "0x31403b1e52051883f2Ce1B1b4C89f36034e1221D";
nftDescriptorAddress = "0x4278C5d322aB92F1D876Dd7Bd9b44d1748b88af2";
positionDescriptorAddress = "0x0D92d35D311E54aB8EEA0394d7E773Fc5144491a";
positionManagerAddress = "0x24EcC5E6EaA700368B8FAC259d3fBD045f695A08";

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

  console.log(tickSpacing, fee, liquidity, slot0);
  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

async function main() {
  const MAINNET_URL = "test network your";

  const WALLET_ADDRESS = "Address";
  const WALLET_SECRET = "Your Wallet Private Key";
  const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);
  const wallet = new ethers.Wallet(WALLET_SECRET);
  const signer = wallet.connect(provider);

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

  const poolData = await getPoolData(poolContract);

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
    recipient: WALLET_ADDRESS,
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
  npx hardhat run --network localhost scripts/addLiquidity.js
  */

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
