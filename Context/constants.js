import booToken from "./BooToken.json";
import lifeToken from "./LifeToken.json";
import singleSwapToken from "./SingleSwapToken.json";
import swapMultiHop from "./SwapMultiHop.json";
import IWETH from "./IWETH.json";
import userStorgeData from "./UserStorageData.json";
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

//BOOTOKEN
export const BooTokenAddress = "0xdB05A386810c809aD5a77422eb189D36c7f24402";
export const BooTokenABI = booToken.abi;

//LIFE TOken
export const LifeTokenAddress = "0xbf2ad38fd09F37f50f723E35dd84EEa1C282c5C9";
export const LifeTokenABI = lifeToken.abi;

//SINGLE SWAP TOKEN
export const SingleSwapTokenAddress =
  "0xfD3e0cEe740271f070607aEddd0Bf4Cf99C92204";
export const SingleSwapTokenABI = singleSwapToken.abi;

// SWAP MULTIHOP
export const SwapMultiHopAddress = "0x01D4648B896F53183d652C02619c226727477C82";
export const SwapMultiHopABI = swapMultiHop.abi;

//IWETH
export const IWETHAddress = "0x2d13826359803522cCe7a4Cfa2c1b582303DD0B4";
export const IWETHABI = IWETH.abi;

export const MainnetIWETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

//USER STORAGE DAta

export const userStorageDataAddrss =
  "0xABc84968376556B5e5B3C3bda750D091a06De536";
export const userStorageDataABI = userStorgeData.abi;
