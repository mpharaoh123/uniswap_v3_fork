import { AlphaRouter } from "@uniswap/smart-order-router";
import { ethers, BigNumber } from "ethers";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { V3_SWAP_ROUTER_ADDRESS } from "../Context/constants";

//GET PRICE
const chainId = 1;

const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);

// const provider = ethers.provider;

const router = new AlphaRouter({ chainId: chainId, provider: provider });

export const swapUpdatePrice = async (
  tokenOne,
  tokenTwo,
  inputAmount,
  slippageAmount,
  deadline,
  walletAddress
) => {
  const tokenOneInit = new Token(chainId, tokenOne.tokenAddress, tokenOne.decimals, tokenOne.symbol, tokenOne.name);
  const tokenTwoInit = new Token(chainId, tokenTwo.tokenAddress, tokenTwo.decimals, tokenTwo.symbol, tokenTwo.name);

  console.log("111",tokenOneInit);
  console.log("222",tokenTwoInit);

  const percentSlippage = new Percent(slippageAmount, 100);
  const tokenOneWei = ethers.utils.parseUnits(inputAmount.toString(), tokenOne.decimals);
  const currencyAmount = CurrencyAmount.fromRawAmount(
    tokenOneInit,
    BigNumber.from(tokenOneWei)
  );

  const route = await router.route(currencyAmount, tokenTwoInit, TradeType.EXACT_INPUT, {
    recipient: walletAddress,
    slippageTolerance: percentSlippage,
    deadline: deadline,
  });

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

  console.log(quoteAmountOut, ratio);
  return [transaction, quoteAmountOut, ratio];
};
