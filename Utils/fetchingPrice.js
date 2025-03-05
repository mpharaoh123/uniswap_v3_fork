const { ethers } = require("ethers");
const axios = require("axios");

const {
  abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
  abi: QuoterABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const MAINNET_URL = "https://rpc.ankr.com/eth";
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);

const ETHERSCAN_API_KEY = "YFSRE2FVXRPUKARC7K6TBM1KNZAK6AQPRG";
const qutorAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

export const getPrice = async (
  inputAmount,
  tokenAddrss0,
  tokenAddrss1,
  fee,
  // poolAddress
) => {
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  );

  // console.log("===", await poolContract.fee());

  // console.log(poolContract);
  // const tokenAddrss0 = await poolContract.token0();
  // const tokenAddrss1 = await poolContract.token1();
  // const fee = await poolContract.fee();
  // console.log(tokenAddrss0, tokenAddrss1);
  const tokenAbi0 = await getAbi(tokenAddrss0);
  const tokenAbi1 = await getAbi(tokenAddrss1);

  const tokenContract0 = new ethers.Contract(tokenAddrss0, tokenAbi0, provider);
  const tokenContract1 = new ethers.Contract(tokenAddrss1, tokenAbi1, provider);

  const tokenSymbol0 = await tokenContract0.symbol();
  const tokenSymbol1 = await tokenContract1.symbol();
  const tokenDecimals0 = await tokenContract0.decimals();
  const tokenDecimals1 = await tokenContract1.decimals();

  const quoterContract = new ethers.Contract(qutorAddress, QuoterABI, provider);
  // const immutables = await getPoolImmutables(poolContract);
  const amountIn = ethers.utils.parseUnits(
    inputAmount.toString(),
    tokenDecimals0
  );

  // const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
  //   tokenAddrss0,
  //   tokenAddrss1,
  //   fee,
  //   amountIn,
  //   0
  // );

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    tokenAddrss0,
    tokenAddrss0,
    fee,
    amountIn,
    0
  );

  const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1);

  return [amountOut, tokenSymbol0, tokenSymbol1];
};

const getAbi = async (address) => {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
  const res = await axios.get(url);
  // console.log("res", res);
  const abi = JSON.parse(res.data.result);
  return abi;
};
