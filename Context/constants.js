import booToken from "./BooToken.json";
import lifeToken from "./LifeToken.json";
import singleSwapToken from "./SingleSwapToken.json";
import swapMultiHop from "./SwapMultiHop.json";
import IWETH from "./IWETH.json";
import userStorgeData from "./UserStorageData.json";
import poolDataList from "./poolData.json";

export const poolData = poolDataList.tokens;

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
  "0x2ca60d89144D4cdf85dA87af4FE12aBF9265F28C";
export const userStorageDataABI = userStorgeData.abi;

export const TOKENS = {
  // Native Wrapped Token
  WETH: {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    symbol: "WETH",
    name: "Wrapped Ethereum",
  },

  // Stablecoins
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    symbol: "USDT",
    name: "Tether USD",
  },
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
  },
  DAI: {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    symbol: "DAI",
    name: "Dai Stablecoin",
  },
  BUSD: {
    address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
    decimals: 18,
    symbol: "BUSD",
    name: "Binance USD",
  },

  // DeFi Tokens
  UNI: {
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
    symbol: "UNI",
    name: "Uniswap",
  },
  AAVE: {
    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    decimals: 18,
    symbol: "AAVE",
    name: "Aave Token",
  },
  LINK: {
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
    symbol: "LINK",
    name: "ChainLink Token",
  },
  CRV: {
    address: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    decimals: 18,
    symbol: "CRV",
    name: "Curve DAO Token",
  },
  COMP: {
    address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    decimals: 18,
    symbol: "COMP",
    name: "Compound",
  },

  // Layer 2 Tokens
  MATIC: {
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    decimals: 18,
    symbol: "MATIC",
    name: "Polygon",
  },
  ARB: {
    address: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
    decimals: 18,
    symbol: "ARB",
    name: "Arbitrum",
  },
  OP: {
    address: "0x4200000000000000000000000000000000000042",
    decimals: 18,
    symbol: "OP",
    name: "Optimism",
  },

  // Gaming & Metaverse Tokens
  SAND: {
    address: "0x3845badAde8e6dFF049820680d1F14bD3903a5d0",
    decimals: 18,
    symbol: "SAND",
    name: "The Sandbox",
  },
  MANA: {
    address: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
    decimals: 18,
    symbol: "MANA",
    name: "Decentraland",
  },

  // Meme Tokens
  SHIB: {
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    decimals: 18,
    symbol: "SHIB",
    name: "Shiba Inu",
  },
  PEPE: {
    address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    decimals: 18,
    symbol: "PEPE",
    name: "Pepe",
  },

  // Other Major Tokens
  MKR: {
    address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    decimals: 18,
    symbol: "MKR",
    name: "Maker",
  },
  SNX: {
    address: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
    decimals: 18,
    symbol: "SNX",
    name: "Synthetix Network Token",
  },
  GRT: {
    address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
    decimals: 18,
    symbol: "GRT",
    name: "The Graph",
  },
  LDO: {
    address: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
    decimals: 18,
    symbol: "LDO",
    name: "Lido DAO Token",
  },
  RPL: {
    address: "0xD33526068D116cE69F19A9ee46F0bd304F21A51f",
    decimals: 18,
    symbol: "RPL",
    name: "Rocket Pool",
  },
  FXS: {
    address: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
    decimals: 18,
    symbol: "FXS",
    name: "Frax Share",
  },
};