import React, { useState, useContext, useEffect, useRef } from "react";
import Image from "next/image";

// INTERNAL IMPORT
import Style from "./HeroSection.module.css";
import images from "../../assets";
import { Token, SearchToken } from "../index";

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
  const [inputAmount, setInputAmount] = useState(0);
  const [outputAmount, setOutPutAmount] = useState(0);
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
      console.log("herosection tokenData:", tokenData);
      const firstToken = tokenData[0];
      setTokenOne({
        name: firstToken.name,
        image: "",
        symbol: firstToken.symbol,
        tokenBalance: firstToken.tokenBalance,
        tokenAddress: firstToken.tokenAddress,
        decimals: firstToken.decimals,
      });

      const secondToken = tokenData[2];
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
            onChange={(e) => {
              if (e.target.value) {
                setInputAmount(e.target.value); // 更新 swapAmount
              }
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
          <button
            className={Style.HeroSection_box_btn}
            onClick={() =>
              singleSwapToken({
                account,
                tokenOne,
                tokenTwo,
                inputAmount,
                outputAmount,
              })
            }
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
