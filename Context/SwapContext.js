import { CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import { AlphaRouter } from "@uniswap/smart-order-router";
import { abi as ERC20_ABI } from "@uniswap/v2-core/build/IERC20.json";
import {abi as QuoterABI} from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
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
  V3_SWAP_ROUTER_ADDRESS,
  WETH_ABI,
  V3_SWAP_QUOTER_ADDRESS,
} from "./constants";

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
          const contract = new ethers.Contract(el.id, ERC20_ABI, provider);
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
        ERC20_ABI,
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

  const getPrice = async (inputAmount, tokenAddrss0, tokenAddrss1, fee) => {
    const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_URL);

    // const tokenAbi0 = await getAbi(tokenAddrss0);
    // const tokenAbi1 = await getAbi(tokenAddrss1);

    const tokenContract0 = new ethers.Contract(
      tokenAddrss0,
      ERC20_ABI,
      provider
    );
    const tokenContract1 = new ethers.Contract(
      tokenAddrss1,
      ERC20_ABI,
      provider
    );

    const tokenSymbol0 = await tokenContract0.symbol();
    const tokenSymbol1 = await tokenContract1.symbol();
    const tokenDecimals0 = await tokenContract0.decimals();
    const tokenDecimals1 = await tokenContract1.decimals();

    const quoterContract = new ethers.Contract(
      V3_SWAP_QUOTER_ADDRESS,
      QuoterABI,
      provider
    );
    // const immutables = await getPoolImmutables(poolContract);
    const amountIn = ethers.utils.parseUnits(
      inputAmount.toString(),
      tokenDecimals0
    );

    const quotedAmountOut =
      await quoterContract.callStatic.quoteExactInputSingle(
        tokenAddrss0,
        tokenAddrss1,
        fee,
        amountIn,
        0
      );

    const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1);
    return [amountOut, tokenSymbol0, tokenSymbol1];
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
      QuoterABI,
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
