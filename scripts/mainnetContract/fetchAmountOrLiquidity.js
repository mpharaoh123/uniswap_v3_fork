const { Contract, BigNumber } = require("ethers");
const {
  Pool,
  Position,
  nearestUsableTick,
  TickMath,
} = require("@uniswap/v3-sdk");
const { Token } = require("@uniswap/sdk-core");
const artifacts = {
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  IUniswapV3PoolABI: require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json"),
};
const { FACTORY_ADDRESS, tokenListMainnet } = require("../constants/constants");

/*
  根据amount1Desired或amount2Desired获取另一个amountDesired和liquidityAmount，但结果不准确
  npx hardhat run --network localhost scripts/mainnetContract/fetchAmountOrLiquidity.js
*/

const token0 = tokenListMainnet[1]; //0为weth
const token1 = tokenListMainnet[2];
const fee = 500; //取值 0.01%:100 0.05%:500 0.3%:3000 1%:10000
const amount1Desired = ethers.utils.parseUnits("10", token0.decimals);
const amount0Desired = null;

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

async function calculateLiquidityAndAmounts(
  poolContract,
  token0,
  token1,
  amount0Desired = null,
  amount1Desired = null,
  tickLower,
  tickUpper
) {
  const poolData = await getPoolData(poolContract);

  const token0Obj = new Token(
    1,
    token0.id,
    parseInt(token0.decimals),
    token0.symbol,
    token0.name
  );
  const token1Obj = new Token(
    1,
    token1.id,
    parseInt(token1.decimals),
    token1.symbol,
    token1.name
  );

  const pool = new Pool(
    token0Obj,
    token1Obj,
    poolData.fee,
    poolData.sqrtPriceX96.toString(),
    poolData.liquidity.toString(),
    poolData.tick
  );

  const sqrtPriceUpper = TickMath.getSqrtRatioAtTick(tickUpper).toString();
  const sqrtPriceLower = TickMath.getSqrtRatioAtTick(tickLower).toString();
  const sqrtPriceCurrent = poolData.sqrtPriceX96.toString(); // 确保精度一致

  console.log(111, sqrtPriceUpper);
  console.log(222, sqrtPriceLower);
  console.log(333, sqrtPriceCurrent);

  let liquidity;
  let calculatedAmount0;
  let calculatedAmount1;

  if (amount0Desired !== null) {
    // 已知 amount0Desired，计算 liquidity 和 amount1Desired
    liquidity = amount0Desired
      .mul(
        ethers.BigNumber.from(sqrtPriceUpper).sub(
          ethers.BigNumber.from(sqrtPriceCurrent)
        )
      )
      .div(
        ethers.BigNumber.from(sqrtPriceUpper).sub(
          ethers.BigNumber.from(sqrtPriceLower)
        )
      );

    calculatedAmount1 = liquidity
      .mul(
        ethers.BigNumber.from(sqrtPriceCurrent).sub(
          ethers.BigNumber.from(sqrtPriceLower)
        )
      )
      .div(ethers.BigNumber.from(2).pow(96));
  } else if (amount1Desired !== null) {
    // 已知 amount1Desired，计算 liquidity 和 amount0Desired
    liquidity = amount1Desired
      .mul(
        ethers.BigNumber.from(sqrtPriceCurrent).sub(
          ethers.BigNumber.from(sqrtPriceLower)
        )
      )
      .div(
        ethers.BigNumber.from(sqrtPriceUpper).sub(
          ethers.BigNumber.from(sqrtPriceLower)
        )
      );

    calculatedAmount0 = liquidity
      .mul(
        ethers.BigNumber.from(sqrtPriceUpper).sub(
          ethers.BigNumber.from(sqrtPriceCurrent)
        )
      )
      .div(ethers.BigNumber.from(2).pow(96));
  } else {
    throw new Error("Either amount0Desired or amount1Desired must be provided");
  }

  return {
    liquidity: liquidity.toString(),
    amount0: calculatedAmount0
      ? calculatedAmount0.toString()
      : amount0Desired.toString(),
    amount1: calculatedAmount1
      ? calculatedAmount1.toString()
      : amount1Desired.toString(),
  };
}

// 示例调用
async function main(
  token0,
  token1,
  amount0Desired = null,
  amount1Desired = null
) {
  const [signer] = await ethers.getSigners();

  const factory = new Contract(
    FACTORY_ADDRESS,
    artifacts.UniswapV3Factory.abi,
    signer
  );

  const poolAddress = await factory.getPool(token0.id, token1.id, fee);
  const poolContract = new Contract(
    poolAddress,
    artifacts.UniswapV3Pool.abi,
    signer
  );

  const poolData = await getPoolData(poolContract);
  const range = 100; // 设置价格范围为当前价格上下 range 个 tick
  const tickLower = nearestUsableTick(
    poolData.tick - range,
    poolData.tickSpacing
  );
  const tickUpper = nearestUsableTick(
    poolData.tick + range,
    poolData.tickSpacing
  );

  const result = await calculateLiquidityAndAmounts(
    poolContract,
    token0,
    token1,
    amount0Desired,
    amount1Desired,
    tickLower,
    tickUpper
  );

  console.log(`Liquidity: ${result.liquidity}`);
  console.log(
    `${token0.symbol} Required: ${ethers.utils.formatUnits(
      result.amount0,
      token0.decimals
    )}`
  );
  console.log(
    `${token1.symbol} Required: ${ethers.utils.formatUnits(
      result.amount1,
      token1.decimals
    )}`
  );
}

// 调用示例
main(token0, token1, amount0Desired, amount1Desired)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
