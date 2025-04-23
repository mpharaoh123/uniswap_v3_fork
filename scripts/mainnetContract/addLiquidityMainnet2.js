require("dotenv").config();
const {
  WETH_ABI,
  ERC20_ABI,
  FACTORY_ADDRESS,
  NON_FUNGABLE_POSITION_MANAGER_ADDRESS,
  tokenListMainnet,
  WETH_ADDRESS,
} = require("../constants/constants");

const artifacts = {
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  IUniswapV3PoolABI: require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json"),
  QuoterAbi: require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json"),
};

const { Contract, BigNumber } = require("ethers");
const { Token } = require("@uniswap/sdk-core");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
const bn = require("bignumber.js");
const { ethers } = require("hardhat");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

/*
  传入 liquidityAmount 添加流动性
  npx hardhat run --network localhost scripts/mainnetContract/addLiquidityMainnet2.js
*/

const token0 = tokenListMainnet[1]; //0为weth
const token1 = tokenListMainnet[2];
const fee = 500; //取值 0.01%:100 0.05%:500 0.3%:3000 1%:10000
const liquidityAmount = "0.000001"; //流动性数量，单位ether

async function main(token0, token1, liquidityAmount) {
  // 确保 token0 的地址小于 token1 的地址
  if (token1.id.toLowerCase() < token0.id.toLowerCase()) {
    [token0, token1] = [token1, token0];
  }

  // 第一个账户的 signer
  const [signer] = await ethers.getSigners();
  const provider = ethers.provider;
  const address = await signer.getAddress();
  const ethBalance = await provider.getBalance(address);
  const balanceInEther = ethers.utils.formatEther(ethBalance); // 将余额从 Wei 转换为 Ether
  console.log(`ETH Balance: ${balanceInEther} ETH`);

  // 动态选择 ABI
  const token0Contract = new Contract(
    token0.id,
    token0.id.toLowerCase() === WETH_ADDRESS.toLowerCase()
      ? WETH_ABI
      : ERC20_ABI,
    signer
  );
  const token1Contract = new Contract(
    token1.id,
    token1.id.toLowerCase() === WETH_ADDRESS.toLowerCase()
      ? WETH_ABI
      : ERC20_ABI,
    signer
  );

  let balance0 = await token0Contract.balanceOf(signer.address);
  let balance1 = await token1Contract.balanceOf(signer.address);

  console.log(
    `Balance of ${token0.symbol}:`,
    ethers.utils.formatUnits(balance0.toString(), token0.decimals)
  );
  console.log(
    `Balance of ${token1.symbol}:`,
    ethers.utils.formatUnits(balance1.toString(), token1.decimals)
  );

  const allowance0 = await token0Contract.allowance(
    address,
    NON_FUNGABLE_POSITION_MANAGER_ADDRESS
  );
  const allowance1 = await token1Contract.allowance(
    address,
    NON_FUNGABLE_POSITION_MANAGER_ADDRESS
  );

  if (allowance0.lt(ethers.constants.MaxUint256)) {
    console.log("Approving token0...");
    await token0Contract
      .connect(signer)
      .approve(
        NON_FUNGABLE_POSITION_MANAGER_ADDRESS,
        ethers.constants.MaxUint256
      );
    console.log("Token0 approved.");
  }

  if (allowance1.lt(ethers.constants.MaxUint256)) {
    console.log("Approving token1...");
    await token1Contract
      .connect(signer)
      .approve(
        NON_FUNGABLE_POSITION_MANAGER_ADDRESS,
        ethers.constants.MaxUint256
      );
    console.log("Token1 approved.");
  }

  const nonfungiblePositionManager = new Contract(
    NON_FUNGABLE_POSITION_MANAGER_ADDRESS,
    artifacts.NonfungiblePositionManager.abi,
    signer
  );

  // console.log(`Token0 allowance: ${ethers.utils.formatUnits(allowance0, token0.decimals)}`);
  // console.log(`Token1 allowance: ${ethers.utils.formatUnits(allowance1, token1.decimals)}`);

  const factory = new Contract(
    FACTORY_ADDRESS,
    artifacts.UniswapV3Factory.abi,
    signer
  );

  const price = encodePriceSqrt(1, 1);
  let poolAddress = await factory.getPool(token0.id, token1.id, fee);

  //createAndInitializePoolIfNecessary中token0和token1需要先排序，否则报错Transaction rever ted without a reason string
  if (poolAddress === ethers.constants.AddressZero) {
    const transaction = await nonfungiblePositionManager
      .connect(signer)
      .createAndInitializePoolIfNecessary(token0.id, token1.id, fee, price, {
        gasLimit: 5000000,
      });
    await transaction.wait();
    poolAddress = await factory
      .connect(signer)
      .getPool(token0.id, token1.id, fee);
    console.log("Pool is created");
  } else {
    console.log("Pool already exists");
  }
  console.log(`poolAddress: ${poolAddress}`);

  // 获取池数据
  const poolContract = new Contract(
    poolAddress,
    artifacts.UniswapV3Pool.abi,
    signer
  );

  const poolData = await getPoolData(poolContract);

  // todo
  
  amount0Desired = amount0Desired.toString();
  amount1Desired = amount1Desired.toString();

  console.log(
    `${token0.symbol} Required: ${ethers.utils.formatUnits(
      amount0Desired,
      token0.decimals
    )}, Available: ${ethers.utils.formatUnits(
      balance0.toString(),
      token0.decimals
    )}`
  );

  console.log(
    `${token1.symbol} Required: ${ethers.utils.formatUnits(
      amount1Desired,
      token1.decimals
    )}, Available: ${ethers.utils.formatUnits(
      balance1.toString(),
      token1.decimals
    )}`
  );

  // 处理 token0 和 token1 的 WETH 存款逻辑
  balance0 = await checkAndDepositWETH(
    token0,
    balance0,
    amount0Desired,
    token0Contract
  );
  balance1 = await checkAndDepositWETH(
    token1,
    balance1,
    amount1Desired,
    token1Contract
  );

  // 检查余额是否仍然不足
  if (ethers.BigNumber.from(balance0.toString()).lt(amount0Desired)) {
    throw new Error(`Insufficient ${token0.symbol} balance`);
  }

  if (ethers.BigNumber.from(balance1.toString()).lt(amount1Desired)) {
    throw new Error(`Insufficient ${token1.symbol} balance`);
  }

  const params = {
    token0: token0.id,
    token1: token1.id,
    fee: poolData.fee,
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
    amount0Desired: amount0Desired,
    amount1Desired: amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  };
  // console.log("params", params);

  // 获取初始流动性数量
  const initialPoolData = await getPoolData(poolContract);
  console.log(
    `Initial liquidity: ${ethers.utils.formatEther(
      initialPoolData.liquidity.toString()
    )}`
  );

  const tx = await nonfungiblePositionManager
    .connect(signer)
    .mint(params, { gasLimit: "5000000" });
  await tx.wait();

  // 获取更新后的流动性数量
  const updatedPoolData = await getPoolData(poolContract);
  console.log(
    `Updated liquidity: ${ethers.utils.formatEther(
      updatedPoolData.liquidity.toString()
    )}`
  );

  // 计算增加的流动性数量
  const addedLiquidity = ethers.BigNumber.from(
    updatedPoolData.liquidity.toString()
  ).sub(initialPoolData.liquidity.toString());
  const formattedAddedLiquidity = ethers.utils.formatEther(
    addedLiquidity.toString()
  ); // 假设流动性单位为整数
  console.log(`Added liquidity: ${formattedAddedLiquidity}`);
}

// 检查并处理 WETH 余额不足的情况
const checkAndDepositWETH = async (
  token,
  balance,
  amountDesired,
  tokenContract
) => {
  if (token.id.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
    if (ethers.BigNumber.from(balance.toString()).lt(amountDesired)) {
      console.log(`Insufficient ${token.symbol} balance, depositing...`);
      const wethDepositAmount =
        ethers.BigNumber.from(amountDesired).sub(balance);
      const wethContract = new Contract(WETH_ADDRESS, WETH_ABI, signer);
      await wethContract.connect(signer).deposit({
        value: wethDepositAmount.toString(),
      });
      console.log(`${token.symbol} deposited.`);
      return await tokenContract.balanceOf(signer.address); // 返回更新后的余额
    }
  }
  return balance; // 如果不需要存款，直接返回当前余额
};

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

const encodePriceSqrt = (reserve1, reserve0) => {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  );
};

const getPrice = async (signer, inputAmount, token0, token1, fee) => {
  const quoterContract = new ethers.Contract(
    V3_SWAP_QUOTER_ADDRESS,
    QuoterAbi.abi,
    signer
  );
  // const immutables = await getPoolImmutables(poolContract);
  const amountIn = ethers.utils.parseUnits(
    inputAmount.toString(),
    token0.decimals
  );

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    token0.id,
    token1.id,
    fee,
    amountIn,
    0
  );

  const amountOut = ethers.utils.formatUnits(quotedAmountOut, token1.decimals);
  return amountOut;
};

main(token0, token1, liquidityAmount)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
