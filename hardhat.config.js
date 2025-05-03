// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          evmVersion: "istanbul",
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    fork: { //不能用 npx hard node 启动节点，节点上还没有部署 usdc, usdt 等主流代币
      url: "https://eth-mainnet.alchemyapi.io/v2/1Dtrq8-CWOYN2T7S8x2GuNOapwh5jq9f",
      accounts: [
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      ],
    },
  },
};
