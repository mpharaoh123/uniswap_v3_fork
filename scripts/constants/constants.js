const WETH_ABI = require("../constants/WETH9.json").abi;
const ERC20_ABI = require("@uniswap/v2-core/build/IERC20.json").abi;

const poolData = require("./poolData.json");
const poolDataMainnet = require("./poolDataMainnet.json");

const ETHERSCAN_API_KEY = "YFSRE2FVXRPUKARC7K6TBM1KNZAK6AQPRG";
const ALCHEMY_URL =
  "https://eth-mainnet.alchemyapi.io/v2/1Dtrq8-CWOYN2T7S8x2GuNOapwh5jq9f";
const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const NON_FUNGABLE_POSITION_MANAGER_ADDRESS =
  "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const tokenList = poolData.tokens;
const tokenListMainnet = poolDataMainnet.tokens;

module.exports = {
  WETH_ABI,
  ERC20_ABI,
  ETHERSCAN_API_KEY,
  ALCHEMY_URL,
  FACTORY_ADDRESS,
  NON_FUNGABLE_POSITION_MANAGER_ADDRESS,
  ROUTER_ADDRESS,
  QUOTER_ADDRESS,
  WETH_ADDRESS,
  tokenList,
  tokenListMainnet,
};
