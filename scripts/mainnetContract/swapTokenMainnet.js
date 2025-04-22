const { ethers } = require("hardhat");
const SwapRouterAbi =
  require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json").abi;
const ROUTER_ADDRESS = require("../constants/constants").ROUTER_ADDRESS;
const {
  WETH_ABI,
  ERC20_ABI,
  tokenListMainnet,
} = require("../constants/constants");

/*
  npx hardhat run --network localhost scripts/mainnetContract/swapTokenMainnet.js
*/

async function swapTokens(tokenIn, tokenOut, amountInNum, fee, slippage) {
  try {
    const provider = ethers.provider; // 获取当前的 Provider
    const [signer] = await ethers.getSigners();

    // 获取最新区块的 baseFeePerGas
    const block = await provider.getBlock("latest");
    const baseFeePerGas = block.baseFeePerGas;
    const maxFeePerGas = baseFeePerGas.mul(3).div(2); // 设置为 baseFeePerGas 的 1.5 倍

    const router = new ethers.Contract(ROUTER_ADDRESS, SwapRouterAbi, signer);

    const recipient = signer.address;
    const deadline = Math.floor(Date.now() / 1000) + 600; // 截止时间（当前时间 + 10 分钟）

    const amountIn = ethers.utils.parseUnits(amountInNum, tokenIn.decimals); // 输入代币数量

    const amountOutMinimum = ethers.utils.parseUnits(
      (amountInNum * (1 - slippage)).toString(),
      tokenOut.decimals
    ); // 最小输出代币数量

    const sqrtPriceLimitX96 = ethers.constants.Zero; // 价格限制（可以设置为0，表示没有限制）

    // 获取 WETH 合约
    const tokenInContract = new ethers.Contract(tokenIn.id, WETH_ABI, signer);

    // 获取 WETH 余额
    const wethBalance = await tokenInContract.balanceOf(signer.address);
    console.log(
      `WETH balance: ${ethers.utils.formatUnits(
        wethBalance,
        tokenIn.decimals
      )} ${tokenIn.symbol}`
    );

    // 检查 WETH 余额是否足够
    if (wethBalance.lt(amountIn)) {
      console.log(
        `Not enough ${tokenIn.symbol} balance. Depositing ETH to WETH...`
      );
      // 调用 WETH 的 deposit 方法
      const depositTx = await tokenInContract.deposit({
        value: amountIn,
        gasLimit: 200000,
        maxFeePerGas: maxFeePerGas, // 设置 maxFeePerGas
      });
      await depositTx.wait();
      console.log("Deposit completed.");
    } else {
      console.log(`${tokenIn.symbol} balance is sufficient. Skipping deposit.`);
    }

    // 批准代币
    const approvalTx = await tokenInContract.approve(ROUTER_ADDRESS, amountIn, {
      maxFeePerGas: maxFeePerGas, // 设置 maxFeePerGas
    });
    console.log("Approving token...");
    await approvalTx.wait();
    console.log("Token approved.");

    // 获取输出代币合约
    const tokenOutContract = new ethers.Contract(
      tokenOut.id,
      ERC20_ABI,
      signer
    );

    // 获取输出代币余额
    const usdtBalanceBeforeSwap = await tokenOutContract.balanceOf(
      signer.address
    );
    console.log(
      `${tokenOut.symbol} balance before swap: ${ethers.utils.formatUnits(
        usdtBalanceBeforeSwap,
        tokenOut.decimals
      )} ${tokenOut.symbol}`
    );

    // 构造调用参数
    const params = {
      tokenIn: tokenIn.id,
      tokenOut: tokenOut.id,
      fee,
      recipient,
      deadline,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96,
    };
    console.log("params", params);

    // 执行 swap
    const swapTx = await router.exactInputSingle(params, {
      gasLimit: 300000,
      maxFeePerGas: maxFeePerGas, // 设置 maxFeePerGas
    });
    console.log("Swapping tokens...");
    const receipt = await swapTx.wait();
    console.log("Swap completed.");

    const wethBalanceAfterSwap = await tokenInContract.balanceOf(
      signer.address
    );
    console.log(
      `${tokenIn.symbol} balance after swap: ${ethers.utils.formatUnits(
        wethBalanceAfterSwap,
        tokenIn.decimals
      )} ${tokenIn.symbol}`
    );

    const usdtBalanceAfterSwap = await tokenOutContract.balanceOf(
      signer.address
    );
    console.log(
      `${tokenOut.symbol} balance after swap: ${ethers.utils.formatUnits(
        usdtBalanceAfterSwap,
        tokenOut.decimals
      )} ${tokenOut.symbol}`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

async function main() {
  const tokenIn = tokenListMainnet[0]; // WETH
  const amountInNum = "0.1"; // 输入代币数量
  const fee = 3000; // 池的手续费等级（例如 0.3%）
  const slippage = 0.001; //默认情况下，Uniswap V3将滑点容忍度设置为0.1%

  // 遍历 tokenListMainnet 中的其他代币
  // for (let i = 1; i < tokenListMainnet.length; i++) {
  for (let i = 1; i < 2; i++) {
    const tokenOut = tokenListMainnet[i];
    console.log(`Swapping ${tokenIn.symbol} to ${tokenOut.symbol}...`);
    await swapTokens(tokenIn, tokenOut, amountInNum, fee, slippage);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
