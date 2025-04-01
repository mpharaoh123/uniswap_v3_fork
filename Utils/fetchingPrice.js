const { ethers } = require("ethers");
const axios = require("axios");
const {
  ETHERSCAN_API_KEY,
  V3_SWAP_QUOTER_ADDRESS,
  ALCHEMY_URL,
} = require("../Context/constants");
const {
  abi: QuoterABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_URL);
export const getPrice = async (
  inputAmount,
  tokenAddrss0,
  tokenAddrss1,
  fee
) => {
  // console.log("111", inputAmount);
  // console.log("222", tokenAddrss0);
  // console.log("333", tokenAddrss1);
  // console.log("444", fee);

  const tokenAbi0 = await getAbi(tokenAddrss0);
  const tokenAbi1 = await getAbi(tokenAddrss1);
  // console.log('===abi===', tokenAbi0);

  const tokenContract0 = new ethers.Contract(tokenAddrss0, tokenAbi0, provider);
  const tokenContract1 = new ethers.Contract(tokenAddrss1, tokenAbi1, provider);

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

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
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
// export const getPrice = async (
//   inputAmount,
//   tokenAddrss0,
//   tokenAddrss1,
//   fee
// ) => {
//   // console.log("111", inputAmount);
//   // console.log("222", tokenAddrss0);
//   // console.log("333", tokenAddrss1);
//   // console.log("444", fee);

//   const tokenAbi0 = await getAbi(tokenAddrss0);
//   const tokenAbi1 = await getAbi(tokenAddrss1);
//   const tokenWeth = await getAbi(wethAddr);

//   const tokenContract0 = new ethers.Contract(tokenAddrss0, tokenAbi0, provider);
//   const tokenContract1 = new ethers.Contract(tokenAddrss1, tokenAbi1, provider);
//   const tokenContractWeth = new ethers.Contract(wethAddr, tokenWeth, provider);

//   const tokenSymbol0 = await tokenContract0.symbol();
//   const tokenSymbol1 = await tokenContract1.symbol();
//   const tokenDecimals0 = await tokenContract0.decimals();
//   const tokenDecimals1 = await tokenContract1.decimals();

//   const quoterContract = new ethers.Contract(
//     V3_SWAP_QUOTER_ADDRESS,
//     QuoterABI,
//     provider
//   );
//   // const immutables = await getPoolImmutables(poolContract);
//   const amountIn = ethers.utils.parseUnits(
//     inputAmount.toString(),
//     tokenDecimals0
//   );

//   const path = ethers.utils.defaultAbiCoder.encode(
//     ["address", "uint24", "address", "uint24", "address"],
//     [tokenAddrss0, 3000, wethAddr, 3000, tokenAddrss1]
//   );

//   const quotedAmountOut = await quoterContract.callStatic.quoteExactInput(
//     path,
//     amountIn
//   );

//   const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1);
//   return [amountOut, tokenSymbol0, tokenSymbol1];
// };

const getAbi = async (address) => {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
  const res = await axios.get(url);
  // console.log("res", res);
  const abi = JSON.parse(res.data.result);
  return abi;
};

// const Web3 = require("web3");
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

  // 这种方法不能用
  // const settings = {
  //   apiKey: "1Dtrq8-CWOYN2T7S8x2GuNOapwh5jq9f",
  //   network: Alchemy.Network.ETH_MAINNET,
  // };
  // const alchemy = new Alchemy(settings);
  // try {
  //   const bytecode = await alchemy.core.getCode(address);
  //   console.log(`Bytecode for contract ${address}:`, bytecode);
  // } catch (error) {
  //   console.error("Error fetching bytecode:", error);
  // }
};
