import Image from "next/image";
import React, { useContext, useEffect, useRef, useState } from "react";

// INTERNAL IMPORT
import images from "../../assets";
import { poolData } from "../../Context/constants";
import { SearchToken, TokenSwap } from "../index";
import Style from "./HeroSection.module.css";

// CONTEXT
import { SwapTokenContext } from "../../Context/SwapContext";

const HeroSection = ({}) => {
  const [openSetting, setOpenSetting] = useState(false);
  const [openTokenOne, setOpenTokenOne] = useState(false);
  const [openTokensTwo, setOpenTokensTwo] = useState(false);
  const [tokenSwapOutPut, setTokenSwapOutPut] = useState(0);
  const [poolMessage, setPoolMessage] = useState("");
  const [search, setSearch] = useState(false);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const timeoutRef = useRef(null);

  const [deadline, setDeadline] = useState(10);
  const [slippage, setSlippage] = useState(0.05);

  const {
    connectWallet,
    account,
    fetchBalances,
    getPrice,
    swapUpdatePrice,
    singleSwapToken,
  } = useContext(SwapTokenContext);

  const token0 = poolData[0];
  const token1 = poolData[1];
  const [tokenOne, setTokenOne] = useState({
    name: token0.name,
    image: "",
    symbol: token0.symbol,
    tokenAddress: token0.id,
    decimals: token0.decimals,
  });

  const [tokenTwo, setTokenTwo] = useState({
    name: token1.name,
    image: "",
    symbol: token1.symbol,
    tokenAddress: token1.id,
    decimals: token1.decimals,
  });
  const [tokenOneBalance, setTokenOneBalance] = useState("0");
  const [tokenTwoBalance, setTokenTwoBalance] = useState("0");

  useEffect(() => {
    // 清除之前的定时器，避免重复调用
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    // 检查 tokenOne、tokenTwo 和 inputAmount 是否有效
    if (
      tokenOne.name &&
      tokenTwo.name &&
      inputAmount > 0 &&
      !isNaN(inputAmount)
    ) {
      // 如果 inputAmount 大于 0，则设置新的定时器
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

  useEffect(() => {
    (async () => {
      const balance0 = await fetchBalances(tokenOne);
      console.log("balance0", balance0);
      if (balance0) setTokenOneBalance(balance0);
      const balance1 = await fetchBalances(tokenTwo);
      console.log("balance1", balance1);
      if (balance1) setTokenTwoBalance(balance1);
    })();
  }, [account, tokenOne, tokenTwo]);

  const callOutPut = async (inputAmount) => {
    const data = await swapUpdatePrice(
      tokenOne,
      tokenTwo,
      inputAmount,
      slippage,
      deadline,
      account
    );
    setTokenSwapOutPut(Number(data[1]).toFixed(6));
    setSearch(false);

    const outputAmount = await getPrice(inputAmount, tokenOne, tokenTwo, 3000); //v3中fee最常用3000, 即0.3%
    console.log("outputAmount", outputAmount);
    setOutputAmount(outputAmount);
    const message = `${inputAmount} ${tokenOne.symbol} = ${Number(
      outputAmount
    ).toFixed(6)} ${tokenTwo.symbol}`;
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
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        <div className={Style.HeroSection_box_input}>
          <input
            type="number"
            placeholder="0"
            value={inputAmount} // 添加 value 属性以绑定输入值
            onChange={(e) => {
              const value = e.target.value;
              setInputAmount(value ? parseFloat(value) : ""); // 更新 inputAmount
            }}
          />
          <button
            style={{ cursor: "pointer" }}
            onClick={() => setOpenTokenOne(true)}
          >
            <Image
              src={images.image || images.etherlogo}
              width={20}
              height={20}
              alt="ether"
            />
            {tokenOne.symbol}
            <small>{parseFloat(tokenOneBalance).toFixed(2)}</small>
          </button>
        </div>

        <div className={Style.HeroSection_box_input}>
          {/* <input type="text" placeholder="0" /> */}
          <p>
            {search ? (
              <Image
                src={images.loading}
                width={50}
                height={20}
                alt="loading"
              />
            ) : (
              tokenSwapOutPut
            )}
          </p>
          <button
            style={{ cursor: "pointer" }}
            onClick={() => setOpenTokensTwo(true)}
          >
            <Image
              src={tokenTwo.image || images.etherlogo}
              width={20}
              height={20}
              alt="ether"
            />
            {tokenTwo.symbol}
            <small>{parseFloat(tokenTwoBalance).toFixed(2)}</small>
          </button>
        </div>

        {search ? (
          <Image src={images.loading} width={50} height={20} alt="loading" />
        ) : (
          poolMessage
        )}

        {account ? (
          <button
            className={Style.HeroSection_box_btn}
            onClick={async () => {
              const result = await singleSwapToken({
                tokenIn: tokenOne,
                tokenOut: tokenTwo,
                amountInNum: inputAmount,
                slippage: slippage,
                deadline: Math.floor(Date.now() / 1000) + deadline * 60,
              });
              if (result) {
                setInputAmount(result.tokenInBalanceAfterSwap);
                setOutputAmount(result.tokenOutBalanceAfterSwap);
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

      {openSetting && (
        <TokenSwap
          setOpenSetting={setOpenSetting}
          slippage={slippage}
          setSlippage={setSlippage}
          deadline={deadline}
          setDeadline={setDeadline}
        />
      )}

      {openTokenOne && (
        <SearchToken
          openToken={setOpenTokenOne}
          tokens={(token) => {
            setTokenOne(token); // 更新 tokenOne
            console.log(`Selected Token1:`, token);
          }}
        />
      )}
      {openTokensTwo && (
        <SearchToken
          openToken={setOpenTokensTwo}
          tokens={(token) => {
            setTokenTwo(token); // 更新 tokenTwo
            console.log(`Selected Token2:`, token);
          }}
        />
      )}
    </div>
  );
};

export default HeroSection;
