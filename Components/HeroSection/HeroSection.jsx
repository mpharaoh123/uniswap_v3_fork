import Image from "next/image";
import React, { useContext, useEffect, useRef, useState } from "react";

// INTERNAL IMPORT
import images from "../../assets";
import { SearchToken, Token } from "../index";
import Style from "./HeroSection.module.css";

// CONTEXT
import { SwapTokenContext } from "../../Context/SwapContext";

const HeroSection = ({}) => {
  // USESTATE
  const [openSetting, setOpenSetting] = useState(false);
  const [openTokenOne, setOpenTokenOne] = useState(false);
  const [openTokensTwo, setOpenTokensTwo] = useState(false);

  const [tokenSwapOutPut, setTokenSwapOutPut] = useState(0);
  const [poolMessage, setPoolMessage] = useState("");
  const [search, setSearch] = useState(false);
  const [inputAmount, setInputAmount] = useState("100");
  const [outputAmount, setOutPutAmount] = useState("");
  const timeoutRef = useRef(null);

  const {
    singleSwapToken,
    connectWallet,
    account,
    tokenData,
    getPrice,
    swapUpdatePrice,
  } = useContext(SwapTokenContext);

  const [tokenOne, setTokenOne] = useState({
    name: "",
    image: "",
    symbol: "",
    tokenBalance: "",
    tokenAddress: "",
    decimals: "",
  });

  const [tokenTwo, setTokenTwo] = useState({
    name: "",
    image: "",
    symbol: "",
    tokenBalance: "",
    tokenAddress: "",
    decimals: "",
  });

  useEffect(() => {
    if (tokenData.length > 0) {
      console.log("hero section tokenData:", tokenData);
      const firstToken = tokenData[1];
      const secondToken = tokenData[2];

      setTokenOne({
        name: firstToken.name,
        image: "",
        symbol: firstToken.symbol,
        tokenBalance: firstToken.tokenBalance,
        tokenAddress: firstToken.tokenAddress,
        decimals: firstToken.decimals,
      });
      setTokenTwo({
        name: secondToken.name,
        image: "",
        symbol: secondToken.symbol,
        tokenBalance: secondToken.tokenBalance,
        tokenAddress: secondToken.tokenAddress,
        decimals: secondToken.decimals,
      });
    }
  }, [tokenData]);

  // 监听 tokenOne 和 tokenTwo 的变化
  useEffect(() => {
    // 清除之前的定时器，避免重复调用
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    // 如果 inputAmount 大于 0，则设置新的定时器
    if (inputAmount > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setSearch(true);
        callOutPut(inputAmount);
      }, 1000); // 延迟 1 秒后执行
    }
  }, [tokenOne, tokenTwo, inputAmount]);

  // 清理函数，确保组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const callOutPut = async (inputAmount) => {
    const deadline = Math.floor(Date.now() / 1000) + 300; // 当前时间戳加上 5 分钟
    const slippageAmount = 25;

    const data = await swapUpdatePrice(
      tokenOne,
      tokenTwo,
      inputAmount,
      slippageAmount,
      deadline,
      account
    );
    console.log("data", data);

    setTokenSwapOutPut(Number(data[1]).toFixed(6));
    setSearch(false);

    const poolData = await getPrice(
      inputAmount,
      tokenOne.tokenAddress,
      tokenTwo.tokenAddress,
      3000
    ); // todo 传fee
    console.log("poolData", poolData);
    setOutPutAmount(poolData[0]);
    const message = `${inputAmount} ${poolData[1]} = ${Number(
      poolData[0]
    ).toFixed(6)} ${poolData[2]}`;
    console.log(message);
    setPoolMessage(message);
  };

  return (
    <div className={Style.HeroSection}>
      <div className={Style.HeroSection_box}>
        <div className={Style.HeroSection_box_heading}>
          <p>Swap</p>
          <div className={Style.HeroSection_box_heading_img}>
            <Image
              src={images.close}
              alt="image"
              width={50}
              height={50}
              onClick={() => setOpenSetting(true)}
            />
          </div>
        </div>

        <div className={Style.HeroSection_box_input}>
          <input
            type="number"
            placeholder="0"
            value={inputAmount.toString()} // 添加 value 属性以绑定输入值
            onChange={(e) => {
              const value = e.target.value;
              setInputAmount(value ? parseFloat(value) : ""); // 更新 inputAmount
            }}
          />
          <button onClick={() => setOpenTokenOne(true)}>
            <Image
              src={images.image || images.etherlogo}
              width={20}
              height={20}
              alt="ether"
            />
            {tokenOne.symbol || "ETH"}
            <small>{parseFloat(tokenOne.tokenBalance).toFixed(2)}</small>
          </button>
        </div>

        <div className={Style.HeroSection_box_input}>
          {/* <input type="text" placeholder="0" /> */}
          <p>
            {search ? (
              <Image
                src={images.loading}
                width={100}
                height={40}
                alt="loading"
              />
            ) : (
              tokenSwapOutPut
            )}
          </p>
          <button onClick={() => setOpenTokensTwo(true)}>
            <Image
              src={tokenTwo.image || images.etherlogo}
              width={20}
              height={20}
              alt="ether"
            />
            {tokenTwo.symbol || "ETH"}
            <small>{parseFloat(tokenTwo.tokenBalance).toFixed(2)}</small>
          </button>
        </div>

        {search ? (
          <Image src={images.loading} width={100} height={40} alt="loading" />
        ) : (
          poolMessage
        )}

        {account ? (
          // 确保在调用 singleSwapToken 之前，tokenOne、tokenTwo 和 inputAmount 已经被正确设置
          <button
            className={Style.HeroSection_box_btn}
            onClick={() => {
              if (tokenOne.symbol && tokenTwo.symbol && inputAmount) {
                singleSwapToken({
                  account,
                  tokenIn: tokenOne,
                  tokenOut: tokenTwo,
                  amountInNum: inputAmount.toString(),
                  slippage: 0.01,
                  deadline: Math.floor(Date.now() / 1000) + 600,
                });
                //todo swap后更新tokenOne和tokenTwo余额
              } else {
                alert("Please select both tokens and enter an amount.");
              }
            }}
          >
            Swap
          </button>
        ) : (
          <button
            onClick={() => connectWallet()}
            className={Style.HeroSection_box_btn}
          >
            Connect Wallet
          </button>
        )}
      </div>

      {openSetting && <Token setOpenSetting={setOpenSetting} />}

      {openTokenOne && (
        <SearchToken
          openToken={setOpenTokenOne}
          tokens={(token) => {
            setTokenOne(token); // 更新 tokenOne
            console.log(`Selected Token1:`, token);
          }}
          tokenData={tokenData}
        />
      )}
      {openTokensTwo && (
        <SearchToken
          openToken={setOpenTokensTwo}
          tokens={(token) => {
            setTokenTwo(token); // 更新 tokenTwo
            console.log(`Selected Token2:`, token);
          }}
          tokenData={tokenData}
        />
      )}
    </div>
  );
};

export default HeroSection;
