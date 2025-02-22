const liveServer = require("live-server");

const options = {
  open: true,
  port: 8080,
  proxy: [
    {
      enable: true,
      target: "https://ethereum-mainnet.s.chainbase.online",
      match: "/v1/",
      pathRewrite: "/v1/",
      headers: {
        "x-api-key": "2sa575o6rbYEMA4c2JRa7RoThff", // 替换为你的 API 密钥
      },
    },
  ],
};

liveServer.start(options);