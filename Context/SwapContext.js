import { CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import { AlphaRouter } from "@uniswap/smart-order-router";
import Erc20Abi from "@uniswap/v2-core/build/IERC20.json";
import QuoterAbi from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import SwapRouter from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

import UniswapV3Factory from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import UniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import NonfungiblePositionManager from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";

import { nearestUsableTick, TickMath } from "@uniswap/v3-sdk";
import axios from "axios";
import bn from "bignumber.js";
import { BigNumber, Contract, ethers } from "ethers";
import React, { useEffect, useState } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import {
  ALCHEMY_URL,
  ERC20_ABI,
  ETHERSCAN_API_KEY,
  FACTORY_ADDRESS,
  NON_FUNGABLE_POSITION_MANAGER_ADDRESS,
  V3_SWAP_QUOTER_ADDRESS,
  V3_SWAP_ROUTER_ADDRESS,
  WETH_ABI,
  WETH_ADDRESS,
} from "./constants";
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

export const SwapTokenContext = React.createContext();

export const SwapTokenContextProvider = ({ children }) => {
  //USSTATE
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState("");
  const [networkConnect, setNetworkConnect] = useState("");

  const fetchBalances = async (token) => {
    try {
      if (!account || !token) return;
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);

      let balance;
      if (token.tokenAddress === WETH_ADDRESS) {
        balance = await provider.getBalance(account);
      } else {
        const contract = new ethers.Contract(
          token.tokenAddress,
          ERC20_ABI,
          provider
        );
        balance = await contract.balanceOf(account);
      }
      const formatBalance = ethers.utils.formatUnits(balance, token.decimals);
      console.log(`${token.symbol} balance is ${formatBalance}`);
      return formatBalance;
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
    return null;
  };

  //FETCH DATA
  const fetchingData = async () => {
    try {
      //GET USER ACCOUNT
      await checkIfWalletConnected();
      //CREATE PROVIDER
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      //GET NETWORK
      const network = await provider.getNetwork();
      setNetworkConnect(network.name);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchingData();
  }, []);

  const swapUpdatePrice = async (
    tokenOne,
    tokenTwo,
    inputAmount,
    slippageAmount,
    deadline,
    walletAddress
  ) => {
    const chainId = 1;
    const provider = new ethers.providers.JsonRpcProvider(
      // "https://rpc.ankr.com/eth" //用这个url，只能获取其中一个代币为weth时，另一个代币的价格，其他代币会报ProviderGasError
      ALCHEMY_URL
    );

    console.log(111, tokenOne);
    console.log(222, tokenTwo);

    const tokenOneInit = new Token(
      chainId,
      tokenOne.tokenAddress,
      Number(tokenOne.decimals),
      tokenOne.symbol,
      tokenOne.name
    );
    const tokenTwoInit = new Token(
      chainId,
      tokenTwo.tokenAddress,
      Number(tokenTwo.decimals),
      tokenTwo.symbol,
      tokenTwo.name
    );

    const percentSlippage = new Percent(slippageAmount, 100);
    const tokenOneWei = ethers.utils.parseUnits(
      inputAmount.toString(),
      tokenOne.decimals
    );
    const currencyAmount = CurrencyAmount.fromRawAmount(
      tokenOneInit,
      BigNumber.from(tokenOneWei)
    );

    const router = new AlphaRouter({ chainId: chainId, provider: provider });

    const route = await router.route(
      currencyAmount,
      tokenTwoInit,
      TradeType.EXACT_INPUT,
      {
        recipient: walletAddress,
        slippageTolerance: percentSlippage,
        deadline: deadline,
      }
    );

    const transaction = {
      data: route.methodParameters.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(route.methodParameters.value),
      from: walletAddress,
      gasPrice: BigNumber.from(route.gasPriceWei),
      gasLimit: ethers.utils.hexlify(1000000),
    };

    const quoteAmountOut = route.quote.toFixed(6);
    const ratio = (inputAmount / quoteAmountOut).toFixed(3);

    // 继续swap没成功
    // const signer = provider.getSigner() // 用不了
    // const signer = new ethers.Wallet("ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider)
    // console.log("address", await signer.getAddress());

    // const tx = await signer.sendTransaction(transaction);
    // console.log(`Transaction hash: ${tx.hash}`);

    // // 等待交易完成
    // const receipt = await tx.wait();
    // console.log(`Transaction receipt:`, receipt);

    // return { txHash: tx.hash, quoteAmountOut, ratio };

    console.log(quoteAmountOut, ratio);
    return [transaction, quoteAmountOut, ratio];
  };

  //SINGL SWAP TOKEN
  const singleSwapToken = async ({
    tokenIn,
    tokenOut,
    amountInNum,
    slippage,
    deadline,
  }) => {
    // console.log(
    //   "singleSwapToken param: ",
    //   account,
    //   tokenIn.symbol,
    //   tokenOut.symbol,
    //   amountInNum,
    //   slippage,
    //   deadline
    // );
    try {
      if (
        !account ||
        !tokenIn ||
        !tokenOut ||
        !Number.isFinite(Number(amountInNum)) ||
        Number(amountInNum) <= 0
      ) {
        alert("Please select both tokens and enter an amount.");
      }
      amountInNum = amountInNum.toString();
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      // 获取最新区块的 baseFeePerGas
      const block = await provider.getBlock("latest");
      const baseFeePerGas = block.baseFeePerGas;
      const maxFeePerGas = baseFeePerGas.mul(3).div(2); // 设置为 baseFeePerGas 的 1.5 倍

      const router = new ethers.Contract(
        V3_SWAP_ROUTER_ADDRESS,
        SwapRouter.abi,
        signer
      );

      const amountIn = ethers.utils.parseUnits(amountInNum, tokenIn.decimals);
      const amountOutMinimum = ethers.utils.parseUnits(
        (amountInNum * (1 - slippage)).toString(),
        tokenOut.decimals
      ); // 最小输出代币数量

      // 获取 WETH 合约
      const tokenInContract = new ethers.Contract(
        tokenIn.tokenAddress,
        WETH_ABI,
        signer
      );

      // 获取 WETH 余额
      const wethBalance = await tokenInContract.balanceOf(account);
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
        console.log(
          `${tokenIn.symbol} balance is sufficient. Skipping deposit.`
        );
      }

      // 批准代币
      const approvalTx = await tokenInContract.approve(
        V3_SWAP_ROUTER_ADDRESS,
        amountIn,
        {
          maxFeePerGas: maxFeePerGas, // 设置 maxFeePerGas
        }
      );
      console.log("Approving token...");
      await approvalTx.wait();
      console.log("Token approved.");

      // 获取输出代币合约
      const tokenOutContract = new ethers.Contract(
        tokenOut.tokenAddress,
        Erc20Abi.abi,
        signer
      );

      // 构造调用参数
      const params = {
        tokenIn: tokenIn.tokenAddress,
        tokenOut: tokenOut.tokenAddress,
        fee: 3000, //稳定币取0.05%, 非稳定币取.03%
        recipient: account,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: ethers.constants.Zero, // 价格限制（可以设置为0，表示没有限制）
      };
      console.log("params", params);

      // 执行 swap
      const swapTx = await router.exactInputSingle(params, {
        gasLimit: 300000,
        maxFeePerGas: maxFeePerGas, // 设置 maxFeePerGas
      });
      console.log("Swapping tokens...");
      await swapTx.wait();
      console.log("Swap completed.");

      let tokenInBalanceAfterSwap = await tokenInContract.balanceOf(account);
      tokenInBalanceAfterSwap = ethers.utils.formatUnits(
        tokenInBalanceAfterSwap,
        tokenIn.decimals
      );
      let tokenOutBalanceAfterSwap = await tokenOutContract.balanceOf(account);
      tokenOutBalanceAfterSwap = ethers.utils.formatUnits(
        tokenOutBalanceAfterSwap,
        tokenOut.decimals
      );
      console.log(
        `${tokenIn.symbol} balance after swap: ${tokenInBalanceAfterSwap} ${tokenIn.symbol}`
      );
      console.log(
        `${tokenOut.symbol} balance after swap: ${tokenOutBalanceAfterSwap} ${tokenOut.symbol}`
      );

      return { tokenInBalanceAfterSwap, tokenOutBalanceAfterSwap };
    } catch (error) {
      console.log(error);
    }
    return {};
  };

  const getPrice = async (inputAmount, token0, token1, fee) => {
    if (
      !inputAmount ||
      !token0.tokenAddress ||
      !token1.tokenAddress ||
      fee <= 0
    ) {
      return;
    }

    const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_URL);

    const quoterContract = new ethers.Contract(
      V3_SWAP_QUOTER_ADDRESS,
      QuoterAbi.abi,
      provider
    );

    const amountIn = ethers.utils.parseUnits(
      inputAmount.toString(),
      token0.decimals
    );

    const quotedAmountOut =
      await quoterContract.callStatic.quoteExactInputSingle(
        token0.tokenAddress,
        token1.tokenAddress,
        fee,
        amountIn,
        0
      );

    const amountOut = ethers.utils.formatUnits(
      quotedAmountOut,
      token1.decimals
    );
    return amountOut;
  };

  // quoterContract.callStatic.quoteExactInput方法获取价格报错
  const getPrice2 = async (inputAmount, tokenAddrss0, tokenAddrss1, fee) => {
    const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_URL);
    const tokenAbi0 = await getAbi(tokenAddrss0);
    const tokenAbi1 = await getAbi(tokenAddrss1);

    const tokenContract0 = new ethers.Contract(
      tokenAddrss0,
      tokenAbi0,
      provider
    );
    const tokenContract1 = new ethers.Contract(
      tokenAddrss1,
      tokenAbi1,
      provider
    );

    const tokenSymbol0 = await tokenContract0.symbol();
    const tokenSymbol1 = await tokenContract1.symbol();
    const tokenDecimals0 = await tokenContract0.decimals();
    const tokenDecimals1 = await tokenContract1.decimals();

    const quoterContract = new ethers.Contract(
      V3_SWAP_QUOTER_ADDRESS,
      QuoterAbi.abi,
      provider
    );
    // const immutables = await getPoolImmutables(poolContract);
    const amountIn = ethers.utils.parseUnits(
      inputAmount.toString(),
      tokenDecimals0
    );

    const path = ethers.utils.defaultAbiCoder.encode(
      ["address", "uint24", "address", "uint24", "address"],
      [tokenAddrss0, 3000, wethAddr, 3000, tokenAddrss1]
    );

    const quotedAmountOut = await quoterContract.callStatic.quoteExactInput(
      path,
      amountIn
    );

    const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1);
    return [amountOut, tokenSymbol0, tokenSymbol1];
  };

  const createPoolAndAddLiquidity = async ({
    token0,
    token1,
    fee,
    amount0Desired,
    amount1Desired,
    amount0Min,
    amount1Min,
    rangeLower, //上偏移量
    rangeUpper, //下偏移量
    // minPrice, //token1 : token0 最小的汇率
    // maxPrice, //token1 : token0 最大的汇率
    deadline,
  }) => {
    try {
      // console.log("liquidity");
      // console.log("token0:", token0);
      // console.log("token1:", token1);
      // console.log("fee:", fee);
      // console.log("amount0Desired:", amount0Desired);
      // console.log("amount1Desired:", amount1Desired);
      // console.log("amount0Min:", amount0Min);
      // console.log("amount1Min:", amount1Min);
      console.log("rangeLower:", rangeLower);
      console.log("rangeUpper:", rangeUpper);
      console.log("deadline:", deadline);

      // console.log("amount0Desired:", !amount0Desired);
      // console.log("amount1Desired:", !amount1Desired);
      // console.log("amount0Min:", !Number.isFinite(Number(amount0Min)));
      // console.log("amount1Min:", !Number.isFinite(Number(amount1Min)));
      // console.log("deadline:", !deadline);

      if (
        !token0.tokenAddress ||
        !token1.tokenAddress ||
        (!isNaN(Number(fee)) && Number(fee) <= 0) ||
        !amount0Desired ||
        !amount1Desired ||
        !Number.isFinite(Number(amount0Min)) || //判断是否是非数字或非字符串数字
        !Number.isFinite(Number(amount1Min)) ||
        !Number.isFinite(Number(rangeLower)) ||
        (!isNaN(Number(rangeLower)) && Number(rangeLower) <= 0) ||
        !Number.isFinite(Number(rangeUpper)) ||
        (!isNaN(Number(rangeUpper)) && Number(rangeUpper) <= 0) ||
        (!isNaN(Number(deadline)) && Number(deadline) <= 0)
      ) {
        console.log("return");
        alert("deposit amount, range and deadline can not be null");
        return;
      }

      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const address = await signer.getAddress(); //ether 5.0以后，不能用signer.address

      // 动态选择 ABI
      const token0Contract = new Contract(
        token0.tokenAddress,
        token0.tokenAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()
          ? WETH_ABI
          : Erc20Abi.abi,
        signer
      );
      const token1Contract = new Contract(
        token1.tokenAddress,
        token1.tokenAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()
          ? WETH_ABI
          : Erc20Abi.abi,
        signer
      );

      let balance0 = await token0Contract.balanceOf(address);
      let balance1 = await token1Contract.balanceOf(address);

      console.log(
        `Balance of ${token0.symbol}:`,
        ethers.utils.formatUnits(balance0.toString(), token0.decimals)
      );
      console.log(
        `Balance of ${token1.symbol}:`,
        ethers.utils.formatUnits(balance1.toString(), token1.decimals)
      );

      //检查代币对NON_FUNGABLE_POSITION_MANAGER_ADDRESS合约的allowance
      const allowance0 = await token0Contract.allowance(
        address,
        NON_FUNGABLE_POSITION_MANAGER_ADDRESS
      );
      const allowance1 = await token1Contract.allowance(
        address,
        NON_FUNGABLE_POSITION_MANAGER_ADDRESS
      );

      if (allowance0.lt(ethers.constants.MaxUint256)) {
        console.log("Approving tokenOne...");
        await token0Contract
          .connect(signer)
          .approve(
            NON_FUNGABLE_POSITION_MANAGER_ADDRESS,
            ethers.constants.MaxUint256
          );
        console.log("Token0 approved.");
      }

      if (allowance1.lt(ethers.constants.MaxUint256)) {
        console.log("Approving tokenTwo...");
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
        NonfungiblePositionManager.abi,
        signer
      );

      // console.log(`Token0 allowance: ${ethers.utils.formatUnits(allowance0, tokenOne.decimals)}`);
      // console.log(`Token1 allowance: ${ethers.utils.formatUnits(allowance1, tokenTwo.decimals)}`);

      const factory = new Contract(
        FACTORY_ADDRESS,
        UniswapV3Factory.abi,
        signer
      );
      // 创建pool或获取pool信息
      let poolAddress = await factory.getPool(
        token0.tokenAddress,
        token1.tokenAddress,
        fee
      );

      //createAndInitializePoolIfNecessary中token0和token1需要先排序，否则报错Transaction rever ted without a reason string
      let tokens = [token0, token1];
      if (
        token1.tokenAddress.toLowerCase() < token0.tokenAddress.toLowerCase()
      ) {
        console.log("reverse token pair");
        tokens = [token1, token0];
      }
      const price = encodePriceSqrt(1, 1); //默认设置初始比例为 1:1 是一般适用于没有明确市场价的代币对
      if (poolAddress === ethers.constants.AddressZero) {
        const transaction = await nonfungiblePositionManager
          .connect(signer)
          .createAndInitializePoolIfNecessary(
            tokens[0].tokenAddress,
            tokens[1].tokenAddress,
            fee,
            price,
            {
              gasLimit: 5000000,
            }
          );
        await transaction.wait();
        poolAddress = await factory
          .connect(signer)
          .getPool(token0.tokenAddress, token1.tokenAddress, fee);
        console.log("Pool is created");
      } else {
        console.log("Pool already exists");
      }
      console.log(`poolAddress: ${poolAddress}`);

      const poolContract = new Contract(poolAddress, UniswapV3Pool.abi, signer);

      const formatBalance0 = ethers.utils.formatUnits(
        balance0.toString(),
        token0.decimals
      );
      const formatBalance1 = ethers.utils.formatUnits(
        balance1.toString(),
        token1.decimals
      );

      console.log(
        `${token0.symbol} Required: ${amount0Desired}, Available: ${formatBalance0}`
      );
      console.log(
        `${token1.symbol} Required: ${amount1Desired}, Available: ${formatBalance1}`
      );

      // 检查代币余额是否足够
      if (parseFloat(formatBalance0) < parseFloat(amount0Desired)) {
        alert(
          `Insufficient ${token0.symbol} balance. Available: ${formatBalance0}, Required: ${amount0Desired}`
        );
        return;
      }

      if (parseFloat(formatBalance1) < parseFloat(amount1Desired)) {
        alert(
          `Insufficient ${token1.symbol} balance. Available: ${formatBalance1}, Required: ${amount1Desired}`
        );
        return;
      }

      amount0Desired = ethers.utils
        .parseUnits(amount0Desired.toString(), token0.decimals)
        .toString();
      amount1Desired = ethers.utils
        .parseUnits(amount1Desired.toString(), token1.decimals)
        .toString();

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

      const initialPoolData = await getPoolData(poolContract);
      // 获取初始流动性数量
      console.log(
        `Initial liquidity: ${ethers.utils.formatEther(
          initialPoolData.liquidity.toString()
        )}`
      );

      //minPrice maxPrice 计算和反计算
      // const { minPrice1, maxPrice1 } = calculateMinPriceAndMaxPrice(
      //   initialPoolData.tick,
      //   initialPoolData.tickSpacing
      // );
      // console.log("tickLower, tickUpper", calculateTicks(minPrice1, maxPrice1));

      /**
       * 1. tick（刻度）价格曲线上的离散点，表示固定价格，范围为 [−887272,887272]。
         2. tickSpacing（刻度间距）：定义了两个连续可用 tick 之间的距离，与池的手续费费率相关，决定了可用的 tick 的间隔
         3. mint(params)中，token0和token1也要按地址大小排序，否则报code: -32603, message: 'Error: Transaction reverted without a reason string'
         4. 根据minPrice和maxPrice计算tickLower和tickUpper有问题，暂时用range代替
       */
      const tickLower =
        nearestUsableTick(initialPoolData.tick, initialPoolData.tickSpacing) -
        initialPoolData.tickSpacing * rangeLower;
      const tickUpper =
        nearestUsableTick(initialPoolData.tick, initialPoolData.tickSpacing) +
        initialPoolData.tickSpacing * rangeUpper;
      console.log("tickLower", tickLower);
      console.log("tickUpper", tickUpper);

      const params = {
        token0: tokens[0].tokenAddress,
        token1: tokens[1].tokenAddress,
        fee: fee,
        tickLower: tickLower,
        tickUpper: tickUpper,
        // tickLower: calculateTicks(minPrice, maxPrice, initialPoolData.tickSpacing).tickLower,
        // tickUpper: calculateTicks(minPrice, maxPrice, initialPoolData.tickSpacing).tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        recipient: address,
        deadline: Math.floor(Date.now() / 1000) + 60 * deadline,
      };
      console.log("params", params);

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
      );
      console.log(`Added liquidity: ${formattedAddedLiquidity}`);
      alert(`${formattedAddedLiquidity} liquidity has been added successfully`);
      updateLiquidityInfo(
        poolAddress,
        token0.symbol,
        token1.symbol,
        fee,
        formattedAddedLiquidity
      );
    } catch (error) {
      console.log(error);
    }
  };

  const formatLiquidity = (liquidity) => {
    // 使用 toFixed(20) 格式化数值，并移除末尾的零
    const formatted = parseFloat(liquidity).toFixed(20);
    return formatted.replace(/0+$/, "").replace(/\.$/, ""); // 移除末尾的零和点
  };

  function getLiquidityForPool(poolAddress) {
    // 从 localStorage 获取现有的流动性池数据
    const liquidityPools =
      JSON.parse(localStorage.getItem("liquidityPools")) || {};

    // 直接通过 poolAddress 获取流动性信息
    const poolInfo = liquidityPools[poolAddress];
    if (poolInfo) {
      return poolInfo;
    }
    return null;
  }

  // 更新或添加流动性信息的方法
  function updateLiquidityInfo(
    poolAddress,
    token0,
    token1,
    fee,
    formattedAddedLiquidity
  ) {
    // 从 localStorage 获取现有的流动性池数据
    let liquidityPools =
      JSON.parse(localStorage.getItem("liquidityPools")) || {};

    // 检查是否已有该 poolAddress
    if (liquidityPools[poolAddress]) {
      // 如果已有，将新的流动性数值加到原有的流动性数值上
      liquidityPools[poolAddress].liquidity += parseFloat(
        formattedAddedLiquidity
      );
    } else {
      // 如果没有，添加新的流动性信息
      liquidityPools[poolAddress] = {
        token0,
        token1,
        fee,
        liquidity: parseFloat(formattedAddedLiquidity),
      };
    }
    // 存储更新后的数据
    localStorage.setItem("liquidityPools", JSON.stringify(liquidityPools));
  }

  //todo 根据minPrice, maxPrice计算tickLower和tickUpper；计算出来的不太对，且添加流动性的话流动性数量为0
  function calculateTicks(minPrice, maxPrice, tickSpacing) {
    // 将价格转换为 tick
    const tickLower = Math.floor(Math.log(minPrice) / Math.log(1.0001));
    const tickUpper = Math.floor(Math.log(maxPrice) / Math.log(1.0001));

    // 确保 tickLower 和 tickUpper 是可用的 tick
    const nearestUsableTick = (tick, spacing) => {
      return Math.floor(tick / spacing) * spacing;
    };

    const usableTickLower = nearestUsableTick(tickLower, tickSpacing);
    const usableTickUpper = nearestUsableTick(tickUpper, tickSpacing);

    console.log("tickLower", usableTickLower);
    console.log("tickUpper", usableTickUpper);

    // 确保 tickLower 和 tickUpper 符合 Uniswap V3 的要求
    if (usableTickLower < TickMath.MIN_TICK) {
      throw new Error("tickLower is below the minimum allowed value.");
    }
    if (usableTickUpper > TickMath.MAX_TICK) {
      throw new Error("tickUpper exceeds the maximum allowed value.");
    }
    if (usableTickLower >= usableTickUpper) {
      throw new Error("tickLower must be less than tickUpper.");
    }
    return { tickLower: usableTickLower, tickUpper: usableTickUpper };
  }

  //根据poolData反算minPrice1, maxPrice1
  function calculateMinPriceAndMaxPrice(tick, tickSpacing) {
    // 计算 nearestUsableTick
    const usableTick = nearestUsableTick(tick, tickSpacing);

    // 计算 tickLower 和 tickUpper
    const tickLower = usableTick - tickSpacing;
    const tickUpper = usableTick + tickSpacing;
    console.log("init tickLower", tickLower);
    console.log("init tickUpper", tickUpper);

    // 计算 minPrice 和 maxPrice
    const minPrice1 = Math.pow(1.0001, tickLower);
    const maxPrice1 = Math.pow(1.0001, tickUpper);

    console.log("price", minPrice1, maxPrice1);
    return { minPrice1, maxPrice1 };
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

  // 检查并处理 WETH 余额不足的情况
  const checkAndDepositWETH = async (
    token,
    balance,
    amountDesired,
    tokenContract
  ) => {
    if (token.tokenAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
      if (ethers.BigNumber.from(balance.toString()).lt(amountDesired)) {
        console.log(`Insufficient ${token.symbol} balance, depositing...`);
        const wethDepositAmount =
          ethers.BigNumber.from(amountDesired).sub(balance);
        const wethContract = new Contract(WETH_ADDRESS, WETH_ABI, signer);
        await wethContract.connect(signer).deposit({
          value: wethDepositAmount.toString(),
        });
        console.log(`${token.symbol} deposited.`);
        return await tokenContract.balanceOf(address); // 返回更新后的余额
      }
    }
    return balance; // 如果不需要deposit，直接返回当前余额
  };

  // 需要开梯子
  const getAbi = async (address) => {
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
    const res = await axios.get(url);
    // console.log("res", res);
    const abi = JSON.parse(res.data.result);
    return abi;
  };

  const getBytecode = async (address) => {
    // 这种方法获取的bytecode和etherscan上拉下来的不一致
    try {
      const web3 = new Web3(
        `https://eth-mainnet.g.alchemy.com/v2/1Dtrq8-CWOYN2T7S8x2GuNOapwh5jq9f`
      );
      console.log("current token", address);
      const bytecode = await web3.eth.getCode(address);
      console.log(`Bytecode for contract ${address}:`, bytecode);
    } catch (error) {
      console.error("Error fetching bytecode:", error);
    }
  };

  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) return console.log("Install Web3 Wallet");
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const firstAccount = accounts[0];
      setAccount(firstAccount);
      return firstAccount;
    } catch (error) {
      console.log(error);
    }
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

  //CONNECT WALLET
  const connectWallet = async () => {
    try {
      if (!window.ethereum) return console.log("Install Web3 Wallet");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const firstAccount = accounts[0];
      return firstAccount;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SwapTokenContext.Provider
      value={{
        connectWallet,
        fetchBalances,
        getPrice,
        swapUpdatePrice,
        singleSwapToken,
        createPoolAndAddLiquidity,
        formatLiquidity,
        getLiquidityForPool,
        account,
        networkConnect,
      }}
    >
      {children}
    </SwapTokenContext.Provider>
  );
};
