import { AlphaRouter } from "@uniswap/smart-order-router";
import { ethers, BigNumber } from "ethers";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { ALCHEMY_URL, V3_SWAP_ROUTER_ADDRESS } from "../Context/constants";

//GET PRICE
const chainId = 1;

const provider = new ethers.providers.JsonRpcProvider(
  // "https://rpc.ankr.com/eth" //用这个url，只能获取其中一个代币为weth时，另一个代币的价格，其他代币会报ProviderGasError
  // "127.0.0.1:8545",
  ALCHEMY_URL);

const router = new AlphaRouter({ chainId: chainId, provider: provider });

// todo 暂不成功
export const swapUpdatePrice = async (
  tokenOne,
  tokenTwo,
  inputAmount,
  slippageAmount,
  deadline,
  walletAddress
) => {
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
