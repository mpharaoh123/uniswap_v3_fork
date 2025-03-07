import React, { useState, useContext, useEffect } from "react";
import Image from "next/image";

//INTERNAL IMPORT
import Style from "./HeroSection.module.css";
import images from "../../assets";
import { Token, SearchToken } from "../index";

//CONTEXT
import { SwapTokenContext } from "../../Context/SwapContext";
import { poolData } from "../../Context/constants.js";

const HeroSection = ({}) => {
  //USESTATE
  const [openSetting, setOpenSetting] = useState(false);
  const [openTokenOne, setOpenTokenOne] = useState(false);
  const [openTokensTwo, setOpenTokensTwo] = useState(false);

  const [tokenSwapOutPut, setTokenSwapOutPut] = useState(0);
  const [poolMessage, setPoolMessage] = useState("");
  const [search, setSearch] = useState(false);
  const [swapAmount, setSwapAmount] = useState(0);

  const {
    singleSwapToken,
    connectWallet,
    account,
    ether,
    dai,
    tokenData,
    getPrice,
    swapUpdatePrice,
  } = useContext(SwapTokenContext);

  useEffect(() => {
    if (tokenData.length > 0) {
      console.log("herosection tokenData:", tokenData);
      const firstToken = tokenData[3];
      setTokenOne({
        name: firstToken.name,
        image: "",
        symbol: firstToken.symbol,
        tokenBalance: firstToken.tokenBalance,
        tokenAddress: firstToken.tokenAddress,
        decimals: firstToken.decimals,
      });
      const secondToken = tokenData[4];
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

  //TOKEN 1
  const [tokenOne, setTokenOne] = useState({
    name: "",
    image: "",
    symbol: "",
    tokenBalance: "",
    tokenAddress: "",
    decimals: "",
  });
  //TOKEN 2
  const [tokenTwo, setTokenTwo] = useState({
    name: "",
    image: "",
    symbol: "",
    tokenBalance: "",
    tokenAddress: "",
    decimals: "",
  });

  const callOutPut = async (inputAmount) => {
    const yourAccount = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const deadline = Math.floor(Date.now() / 1000) + 300; // 当前时间戳加上 5 分钟
    const slippageAmount = 25;
    // console.log("tokenOne", tokenOne);
    // console.log("tokenTwo", tokenTwo);

    const data = await swapUpdatePrice(
      tokenOne,
      tokenTwo,
      inputAmount,
      slippageAmount,
      deadline,
      yourAccount
    );
    console.log("data", data);

    setTokenSwapOutPut(data[1]);
    setSearch(false);

    const poolData = await getPrice(
      inputAmount,
      tokenOne.tokenAddress,
      tokenTwo.tokenAddress,
      3000
    ); //todo 传fee
    const message = `${inputAmount} ${poolData[1]} = ${poolData[0]} ${poolData[2]}`;
    console.log(message);
    setPoolMessage(message);
  };

  //JSX
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
                callOutPut(e.target.value),
                  setSwapAmount(e.target.value),
                  setSearch(true);
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
                token1: tokenOne,
                token2: tokenTwo,
                swapAmount,
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
            setTokenOne(token); // 更新 tokenOne 或 tokenTwo
            console.log(`Selected Token1:`, token);
          }}
          tokenData={tokenData}
        />
      )}
      {openTokensTwo && (
        <SearchToken
          openToken={setOpenTokensTwo}
          tokens={(token) => {
            setTokenTwo(token); // 更新 tokenOne 或 tokenTwo
            console.log(`Selected Token2:`, token);
          }}
          tokenData={tokenData}
        />
      )}
    </div>
  );
};

export default HeroSection;
