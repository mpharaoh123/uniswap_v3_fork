import React, { useState, useEffect } from "react";
import { ethers, BigNumber, errors } from "ethers";
import Web3Modal from "web3modal";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import SwapRouter from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
import {
  poolData,
  V3_SWAP_ROUTER_ADDRESS as UNISWAP_V3_ROUTER_ADDRESS,
  ALCHEMY_URL,
} from "./constants";

//INTERNAL IMPORT
import {
  checkIfWalletConnected,
  connectWallet,
  connectingWithUserStorageContract,
} from "../Utils/appFeatures";

import { getPrice } from "../Utils/fetchingPrice";
import { swapUpdatePrice } from "../Utils/swapUpdatePrice";
import { addLiquidityExternal } from "../Utils/addLiquidity";
import { getLiquidityData } from "../Utils/checkLiquidity";
import { connectingWithPoolContract } from "../Utils/deployPool";

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
        if (el.symbol == 'WETH') {
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
    tokenOne,
    tokenTwo,
    inputAmount,
    outputAmount,
  }) => {
    console.log(
      "singleSwapToken",
      account,
      tokenOne.tokenAddress,
      tokenTwo.tokenAddress,
      inputAmount,
      outputAmount
    );
    try {
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const uniswapRouter = new ethers.Contract(
        UNISWAP_V3_ROUTER_ADDRESS,
        SwapRouter.abi,
        signer
      );

      const amountIn = ethers.utils.parseUnits(inputAmount, tokenOne.decimals);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const amountOutMinimum = ethers.utils
        .parseUnits(outputAmount, tokenTwo.decimals)
        .mul(995)
        .div(1000);

      console.log("amountIn", amountIn.toString());
      console.log("amountOutMinimum", amountOutMinimum.toString());

      const params = {
        tokenIn: tokenOne.tokenAddress,
        tokenOut: tokenTwo.tokenAddress,
        fee: 3000,
        recipient: account,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0, // 价格限制，默认为 0
        deadline: deadline,
      };

      // todo 报错
      const gasPrice = await provider.getGasPrice();
      const swapTx = await uniswapRouter.exactInputSingle(params, {
        gasLimit: 300000,
        gasPrice: gasPrice.mul(2),
      });

      console.log(`Swap transaction sent: ${swapTx.hash}`);
      await swapTx.wait();
      console.log("Swap transaction confirmed");

      // let singleSwapToken;
      // let weth;
      // let dai;
      // singleSwapToken = await connectingWithSingleSwapToken();
      // weth = await connectingWithIWTHToken();
      // dai = await connectingWithDAIToken();

      // console.log(singleSwapToken);
      // const decimals0 = 18;
      // const inputAmount = swapAmount;
      // const amountIn = ethers.utils.parseUnits(
      //   inputAmount.toString(),
      //   decimals0
      // );

      // await weth.deposit({ value: amountIn });
      // console.log(amountIn);
      // await weth.approve(singleSwapToken.address, amountIn);
      // //SWAP
      // const transaction = await singleSwapToken.swapExactInputSingle(
      //   tokenOne.tokenAddress.tokenAddress,
      //   tokenTwo.tokenAddress.tokenAddress,
      //   amountIn,
      //   {
      //     gasLimit: 300000,
      //   }
      // );
      // await transaction.wait();
      // console.log(transaction);
      // const balance = await dai.balanceOf(account);
      // const transferAmount = BigNumber.from(balance).toString();
      // const ethValue = ethers.utils.formatEther(transferAmount);
      // setDai(ethValue);
      // console.log("DAI balance:", ethValue);
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
