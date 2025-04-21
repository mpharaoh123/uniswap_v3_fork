import SwapRouter from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import { BigNumber, ethers } from "ethers";
import React, { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { IWETHABI, poolData, V3_SWAP_ROUTER_ADDRESS } from "./constants";

//INTERNAL IMPORT
import {
  checkIfWalletConnected,
  connectingWithUserStorageContract,
  connectWallet,
} from "../Utils/appFeatures";

import { addLiquidityExternal } from "../Utils/addLiquidity";
import { connectingWithPoolContract } from "../Utils/deployPool";
import { getPrice } from "../Utils/fetchingPrice";
import { swapUpdatePrice } from "../Utils/swapUpdatePrice";

import ERC20 from "./ERC20.json";

export const SwapTokenContext = React.createContext();

export const SwapTokenContextProvider = ({ children }) => {
  //USSTATE
  const [account, setAccount] = useState("");
  const [ether, setEther] = useState("");
  const [networkConnect, setNetworkConnect] = useState("");

  const [tokenData, setTokenData] = useState([]);
  const [getAllLiquidity, setGetAllLiquidity] = useState([]);
  //TOP TOKENS
  const [topTokensList, setTopTokensList] = useState([]);

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
      console.log("ethValue", ethValue);
      setEther(ethValue);

      //GET NETWORK
      const network = await provider.getNetwork();
      setNetworkConnect(network.name);

      //ALL TOKEN BALANCE AND DATA
      const fetchedTokenData = [];
      console.log("poolData", poolData);
      for (const el of poolData) {
        let convertTokenBal = "";
        if (el.symbol == "WETH") {
          const balance = await provider.getBalance(userAccount);
          convertTokenBal = ethers.utils.formatUnits(balance, el.decimals);
        } else {
          const contract = new ethers.Contract(el.id, ERC20, provider);
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
      // console.log("tokenData", tokenData);

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
    fetchingData();
  }, []);

  const sortAddresses = (address1, address2) => {
    const lowerAddress1 = address1.toLowerCase();
    const lowerAddress2 = address2.toLowerCase();
    if (lowerAddress1 < lowerAddress2) {
      return [address1, address2];
    } else {
      return [address2, address1];
    }
  };

  //CREATE AND ADD LIQUIDITY
  const createLiquidityAndPool = async ({
    tokenAddress0,
    tokenAddress1,
    fee,
    tokenPrice1,
    tokenPrice2,
    slippage,
    deadline,
    tokenAmmountOne,
    tokenAmmountTwo,
  }) => {
    try {
      tokenAddress0 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      tokenAddress1 = "0xdac17f958d2ee523a2206206994597c13d831ec7";
      fee = 3000; //0.3%
      tokenPrice1 = 10;
      tokenPrice2 = 1000;
      tokenAmmountOne = 1000;
      tokenAmmountTwo = 100;

      tokenAddress0,
        (tokenAddress1 = sortAddresses(tokenAddress0, tokenAddress1));

      console.log(
        tokenAddress0,
        tokenAddress1,
        fee,
        tokenPrice1,
        tokenPrice2,
        slippage,
        deadline,
        tokenAmmountOne,
        tokenAmmountTwo
      );

      //CREATE POOL
      const createPool = await connectingWithPoolContract(
        tokenAddress0,
        tokenAddress1,
        fee,
        tokenPrice1,
        tokenPrice2
      );

      const poolAddress = createPool;
      console.log(poolAddress);

      //CREATE LIQUIDITY
      const info = await addLiquidityExternal(
        tokenAddress0,
        tokenAddress1,
        poolAddress,
        fee,
        tokenAmmountOne,
        tokenAmmountTwo
      );
      console.log(info);

      //ADD DATA
      const userStorageData = await connectingWithUserStorageContract();

      const userLiqudity = await userStorageData.addToBlockchain(
        poolAddress,
        tokenAddress0,
        tokenAddress1
      );
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
    console.log(
      "singleSwapToken param: ",
      account,
      tokenIn,
      tokenOut,
      amountInNum,
      slippage,
      deadline
    );
    try {
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      // 获取最新区块的 baseFeePerGas
      const block = await provider.getBlock("latest");
      const baseFeePerGas = block.baseFeePerGas;
      const maxFeePerGas = baseFeePerGas.mul(3).div(2); // 设置为 baseFeePerGas 的 1.5 倍

      const uniswapRouter = new ethers.Contract(
        V3_SWAP_ROUTER_ADDRESS,
        SwapRouter.abi,
        signer
      );

      const amountIn = ethers.utils.parseUnits(inputAmount, tokenIn.decimals);

      const amountOutMinimum = ethers.utils.parseUnits(
        (inputAmount * (1 - slippage)).toString(),
        tokenOut.decimals
      ); // 最小输出代币数量

      // 获取 WETH 合约
      const tokenInContract = new ethers.Contract(
        tokenIn.id,
        IWETHABI,
        signer
      );

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
        console.log(
          `${tokenIn.symbol} balance is sufficient. Skipping deposit.`
        );
      }

      // 批准代币
      const approvalTx = await tokenInContract.approve(
        ROUTER_ADDRESS,
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
        tokenOut.id,
        ERC20,
        signer
      );

      // 构造调用参数
      const params = {
        tokenIn: tokenIn.id,
        tokenOut: tokenOut.id,
        fee: 3000, //稳定币取0.05%, 非稳定币取.03%
        account,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: ethers.constants.Zero, // 价格限制（可以设置为0，表示没有限制）
      };

      // 执行 swap
      const swapTx = await router.exactInputSingle(params, {
        gasLimit: 300000,
        maxFeePerGas: maxFeePerGas, // 设置 maxFeePerGas
      });
      console.log("Swapping tokens...");
      await swapTx.wait();
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
