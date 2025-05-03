import WETH9 from "./WETH9.json";
import poolDataList from "./poolData.json";

export const poolData = poolDataList.tokens;

export const ETHERSCAN_API_KEY = "YFSRE2FVXRPUKARC7K6TBM1KNZAK6AQPRG";
export const ALCHEMY_URL =
  "https://eth-mainnet.alchemyapi.io/v2/1Dtrq8-CWOYN2T7S8x2GuNOapwh5jq9f";
export const V3_SWAP_ROUTER_ADDRESS =
  "0xE592427A0AEce92De3Edee1F18E0157C05861564";
export const NON_FUNGABLE_POSITION_MANAGER_ADDRESS =
  "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
export const V3_SWAP_QUOTER_ADDRESS =
  "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
export const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const ERC20_ABI = require("@uniswap/v2-core/build/IERC20.json").abi;
export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const WETH_ABI = WETH9.abi;
