import { CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import { nearestUsableTick, Pool, Position } from "@uniswap/v3-sdk";
import { AlphaRouter } from "@uniswap/smart-order-router";
import Erc20Abi from "@uniswap/v2-core/build/IERC20.json";
import QuoterAbi from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import SwapRouter from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import React, { useEffect, useState } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import {
  ALCHEMY_URL,
  ETHERSCAN_API_KEY,
  poolData,
  V3_SWAP_QUOTER_ADDRESS,
  V3_SWAP_ROUTER_ADDRESS,
  WETH_ABI,
} from "./constants";

export const SwapTokenContext = React.createContext();

export const SwapTokenContextProvider = ({ children }) => {
  //USSTATE
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState("");
  const [ether, setEther] = useState("");
  const [networkConnect, setNetworkConnect] = useState("");

  const [tokenData, setTokenData] = useState([]);
  const [getAllLiquidity, setGetAllLiquidity] = useState([]);
  //TOP TOKENS
  const [topTokensList, setTopTokensList] = useState([]);

  // todo 获取不到signer
  const fetchSinger = async () => {
    try {
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      setSigner(signer);
    } catch (error) {
      console.log(error);
    }
  };

  //FETCH DATA
  const fetchingData = async () => {
    try {
      //GET USER ACCOUNT
      const userAccount = await checkIfWalletConnected();
      setAccount(userAccount);

      //CREATE PROVIDER
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      //CHECK Balance
      const balance = await provider.getBalance(userAccount);
      const convertBal = BigNumber.from(balance).toString();
      const ethValue = ethers.utils.formatEther(convertBal);
      // console.log("ethValue", ethValue);
      setEther(ethValue);

      //GET NETWORK
      const network = await provider.getNetwork();
      setNetworkConnect(network.name);

      //ALL TOKEN BALANCE AND DATA
      const fetchedTokenData = [];
      // console.log("poolData", poolData);
      for (const el of poolData) {
        let convertTokenBal = "";
        if (el.symbol == "WETH") {
          const balance = await provider.getBalance(userAccount);
          convertTokenBal = ethers.utils.formatUnits(balance, el.decimals);
        } else {
          const contract = new ethers.Contract(el.id, Erc20Abi.abi, provider);
          const ercBalance = await contract.balanceOf(userAccount);
          convertTokenBal = ethers.utils.formatUnits(ercBalance, el.decimals);
        }
        const existingToken = fetchedTokenData.find(
          (token) => token.tokenAddress === el.id
        );
        if (!existingToken) {
          fetchedTokenData.push({
            name: el.name,
            symbol: el.symbol,
            tokenBalance: convertTokenBal,
            tokenAddress: el.id,
            decimals: parseInt(el.decimals),
          });
        }
      }
      setTokenData(fetchedTokenData);
      console.log("tokenData", tokenData);

      // //GET LIQUDITY
      // const userStorageData = await connectingWithUserStorageContract();
      // const userLiquidity = await userStorageData.getAllTransactions();
      // console.log("userLiquidity", userLiquidity);

      // userLiquidity.map(async (el, i) => {
      //   const liquidityData = await getLiquidityData(
      //     el.poolAddress,
      //     el.tokenAddress0,
      //     el.tokenAddress1
      //   );

      //   getAllLiquidity.push(liquidityData);
      //   console.log("getAllLiquidity", getAllLiquidity);
      // });

      setTopTokensList(poolData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSinger();
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
      // "127.0.0.1:8545",
      ALCHEMY_URL
    );

    const tokenOneInit = new Token(
      chainId,
      tokenOne.tokenAddress,
      tokenOne.decimals,
      tokenOne.symbol,
      tokenOne.name
    );
    const tokenTwoInit = new Token(
      chainId,
      tokenTwo.tokenAddress,
      tokenTwo.decimals,
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

  //CREATE AND ADD LIQUIDITY todo
  const createLiquidityAndPool = async ({
    token0,
    token1,
    fee,
    amount0Desired,
    amount1Desired,
    slippage,
    deadline,
    amount0Min = 0,
    amount1Min = 0,
  }) => {
    try {
      // token0.tokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      // token1.tokenAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
      // fee = 3000; //0.3%
      // amount0Desired = 10;
      // amount1Desired = 1000;
      // amount0Min = 1000;
      // amount1Min = 100;

      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      if (tokenAddress1.toLowerCase() < tokenAddress0.toLowerCase()) {
        [tokenAddress0, tokenAddress1] = [tokenAddress1, tokenAddress0];
      }

      // 动态选择 ABI
      const token0Contract = new Contract(
        token0.tokenAddress,
        token0.tokenAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()
          ? WETH_ABI
          : Erc20Abi,
        signer
      );
      const token1Contract = new Contract(
        token1.tokenAddress,
        token1.tokenAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()
          ? WETH_ABI
          : Erc20Abi,
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
        signer.address,
        NON_FUNGABLE_POSITION_MANAGER_ADDRESS
      );
      const allowance1 = await token1Contract.allowance(
        signer.address,
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
        artifacts.NonfungiblePositionManager.abi,
        signer
      );

      // console.log(`Token0 allowance: ${ethers.utils.formatUnits(allowance0, tokenOne.decimals)}`);
      // console.log(`Token1 allowance: ${ethers.utils.formatUnits(allowance1, tokenTwo.decimals)}`);

      const factory = new Contract(
        FACTORY_ADDRESS,
        artifacts.UniswapV3Factory.abi,
        signer
      );

      const price = encodePriceSqrt(1, 1);
      let poolAddress = await factory.getPool(
        token0.tokenAddress,
        token1.tokenAddress,
        fee
      );

      //createAndInitializePoolIfNecessary中token0和token1需要先排序，否则报错Transaction rever ted without a reason string
      if (poolAddress === ethers.constants.AddressZero) {
        const transaction = await nonfungiblePositionManager
          .connect(signer)
          .createAndInitializePoolIfNecessary(
            token0.tokenAddress,
            token1.tokenAddress,
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

      // 获取池数据
      const poolContract = new Contract(
        poolAddress,
        artifacts.UniswapV3Pool.abi,
        signer
      );

      console.log(
        `${token0.symbol} Required: ${amount0Desired}, 
            Available: ${ethers.utils.formatUnits(
              balance0.toString(),
              token0.decimals
            )}`
      );

      console.log(
        `${token1.symbol} Required: ${amount1Desired}, 
            Available: ${ethers.utils.formatUnits(
              balance1.toString(),
              token1.decimals
            )}`
      );

      amount0Desired = ethers.utils
        .parseUnits(amount0Desired, token0.decimals)
        .toString();
      amount1Desired = ethers.utils
        .parseUnits(amount1Desired, token1.decimals)
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

      //fork的主网，所以chainId为1
      const token0Obj = new Token(
        1,
        token0.tokenAddress,
        parseInt(token0.decimals),
        token0.symbol,
        token0.name
      );
      const token1Obj = new Token(
        1,
        token1.tokenAddress,
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
      const range = 10; // 设置价格范围为当前价格上下 range 个 tick，数值越大，覆盖的流动性范围越大，需要的代币越多
      const position = new Position({
        pool: pool,
        liquidity: ethers.utils.parseEther(liquidityAmount),
        tickLower: nearestUsableTick(
          poolData.tick - range,
          poolData.tickSpacing
        ),
        tickUpper: nearestUsableTick(
          poolData.tick + range,
          poolData.tickSpacing
        ),
      });

      let { amount0: amount0Desired, amount1: amount1Desired } =
        position.mintAmounts;

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

      const poolData = await getPoolData(poolContract);
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
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
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
    } catch (error) {
      console.log(error);
    }
  };

  //SINGL SWAP TOKEN
  const singleSwapToken = async ({
    account,
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

      const wethBalanceAfterSwap = await tokenInContract.balanceOf(account);
      console.log(
        `${tokenIn.symbol} balance after swap: ${ethers.utils.formatUnits(
          wethBalanceAfterSwap,
          tokenIn.decimals
        )} ${tokenIn.symbol}`
      );

      const usdtBalanceAfterSwap = await tokenOutContract.balanceOf(account);
      console.log(
        `${tokenOut.symbol} balance after swap: ${ethers.utils.formatUnits(
          usdtBalanceAfterSwap,
          tokenOut.decimals
        )} ${tokenOut.symbol}`
      );
    } catch (error) {
      console.log(error);
    }
  };

  const getPrice = async (inputAmount, token0, token1, fee) => {
    const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_URL);

    // 确保 token0 的地址小于 token1 的地址
    if (token1.tokenAddress.toLowerCase() < token0.tokenAddress.toLowerCase()) {
      [token0, token1] = [token1, token0];
    }

    console.log(
      provider._isProvider,
      inputAmount,
      token0.decimals,
      token1.decimals,
      fee
    );

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
      return firstAccount;
    } catch (error) {
      console.log(error);
    }
  };

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
        singleSwapToken,
        connectWallet,
        getPrice,
        swapUpdatePrice,
        createLiquidityAndPool,
        getAllLiquidity,
        account,
        networkConnect,
        ether,
        tokenData,
        topTokensList,
      }}
    >
      {children}
    </SwapTokenContext.Provider>
  );
};
