import Image from "next/image";
import React, { useContext, useEffect, useRef, useState } from "react";

// INTERNAL IMPORT
import images from "../../assets";
import { SearchToken, Token } from "../../Components/index.js";
import { poolData } from "../../Context/constants";
import Style from "./PoolAdd.module.css";

import { SwapTokenContext } from "../../Context/SwapContext";

const PoolAdd = ({ setClosePool, createPoolAndAddLiquidity }) => {
  const [openModel, setOpenModel] = useState(false);
  const [openTokenModelOne, setOpenTokenModelOne] = useState(false);
  const [openTokenModelTwo, setOpenTokenModelTwo] = useState(false);
  const [active, setActive] = useState(1);
  const [openFee, setOpenFee] = useState(false);
  const [rangeLower, setRangeLower] = useState(0);
  const [rangeUpper, setRangeUpper] = useState(0);
  // const [minPrice, setMinPrice] = useState(0);
  // const [maxPrice, setMaxPrice] = useState(0);

  const [deadline, setDeadline] = useState(10); //默认10min
  const [tokenAmountOne, setTokenAmountOne] = useState("");
  const [tokenAmountTwo, setTokenAmountTwo] = useState("");
  const tokenOneTimeoutRef = useRef(null); // 用于第一个输入框的定时器
  const tokenTwoTimeoutRef = useRef(null); // 用于第二个输入框的定时器
  const [liquidityInfos, setLiquidityInfos] = useState({});

  const { account, formatLiquidity, getPrice, fetchBalances } =
    useContext(SwapTokenContext);

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

  const feePairs = [
    {
      fee: "0.01%",
      info: "Best for ultra-stable pairs",
      number: "5% Select",
      feeSystem: 100,
    },
    {
      fee: "0.05%",
      info: "Best for stable pairs",
      number: "67% Select",
      feeSystem: 500,
    },
    {
      fee: "0.3%",
      info: "Best for most pairs",
      number: "28% Select",
      feeSystem: 3000,
    },
    {
      fee: "1%",
      info: "Best for exotic pairs",
      number: "0.3% Select",
      feeSystem: 10000,
    },
  ];
  const [fee, setFee] = useState(feePairs[1].feeSystem);

  useEffect(() => {
    updateLiquidityInfo();
  }, []);

  useEffect(() => {
    (async () => {
      const balance0 = await fetchBalances(tokenOne);
      console.log("balance1", balance0);
      setTokenOneBalance(balance0);
      const balance1 = await fetchBalances(tokenTwo);
      console.log("balance1", balance1);
      setTokenTwoBalance(balance1);
      setTokenAmountOne("");
      setTokenAmountTwo("");
    })();
  }, [account, tokenOne, tokenTwo]);

  const updateLiquidityInfo = () => {
    const liquidityPools =
      JSON.parse(localStorage.getItem("liquidityPools")) || {};
    setLiquidityInfos(liquidityPools);
  };

  // 输入框1的处理逻辑
  const handleTokenAmountOneChange = (e) => {
    const value = e.target.value;
    setTokenAmountOne(value);
    // 清除之前的定时器
    clearTimeout(tokenOneTimeoutRef.current);
    // 设置新的定时器
    tokenOneTimeoutRef.current = setTimeout(async () => {
      if (value > 0 && tokenTwo.tokenAddress && fee > 0) {
        const amountOut = await getPrice(value, tokenOne, tokenTwo, fee);
        console.log("amountOut", amountOut);
        setTokenAmountTwo(amountOut);
      }
    }, 500); // 延迟1秒
  };

  // 输入框2的处理逻辑
  const handleTokenAmountTwoChange = (e) => {
    const value = e.target.value;
    setTokenAmountTwo(value);
    // 清除之前的定时器
    clearTimeout(tokenTwoTimeoutRef.current);
    // 设置新的定时器
    tokenTwoTimeoutRef.current = setTimeout(async () => {
      if (value > 0 && tokenOne.tokenAddress && fee > 0) {
        const amountOut = await getPrice(value, tokenTwo, tokenOne, fee);
        console.log("amountOut", amountOut);
        setTokenAmountOne(amountOut);
      }
    }, 500); // 延迟1秒
  };

  return (
    <div className={Style.PoolAdd}>
      <div className={Style.PoolAdd_box}>
        <div className={Style.PoolAdd_box_header}>
          <div className={Style.PoolAdd_box_header_left}>
            <Image
              src={images.arrowLeft}
              alt="image"
              width={30}
              height={30}
              onClick={() => setClosePool(false)}
              style={{ cursor: "pointer" }}
            />
          </div>
          <div className={Style.PoolAdd_box_header_right}>
            <Image
              src={images.close}
              alt="image"
              width={50}
              height={50}
              onClick={() => setOpenModel(true)}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        {/* //SELECT PRICE RANGE */}
        <div className={Style.PoolAdd_box_price}>
          {/* //LEFT */}
          <div className={Style.PoolAdd_box_price_left}>
            <h4>Select Pair</h4>
            <div className={Style.PoolAdd_box_price_left_token}>
              <div
                style={{ cursor: "pointer" }}
                className={Style.PoolAdd_box_price_left_token_info}
                onClick={() => setOpenTokenModelOne(true)}
              >
                <p>
                  <Image
                    src={images.etherlogo}
                    alt="image"
                    width={20}
                    height={20}
                  />
                </p>
                <p>{tokenOne.symbol || "ETH"}</p>
              </div>
              <div
                style={{ cursor: "pointer" }}
                className={Style.PoolAdd_box_price_left_token_info}
                onClick={() => setOpenTokenModelTwo(true)}
              >
                <p>
                  <Image
                    src={images.etherlogo}
                    alt="image"
                    width={20}
                    height={20}
                  />
                </p>
                <p>{tokenTwo.symbol || "Select"}</p>
              </div>
            </div>
            {/* //FEE */}
            <div className={Style.PoolAdd_box_price_left_fee}>
              <div className={Style.PoolAdd_box_price_left_fee_left}>
                <h4>Fee tier</h4>
                <p>The % you will earn in fees</p>
              </div>
              {openFee ? (
                <button onClick={() => setOpenFee(false)}>Hide</button>
              ) : (
                <button onClick={() => setOpenFee(true)}>Show</button>
              )}
            </div>

            {/* //FEE LIST */}
            {openFee && (
              <div className={Style.PoolAdd_box_price_left_list}>
                <div className={Style.PoolAdd_box_price_left_list_row}>
                  {feePairs.map((el, i) => (
                    <div
                      className={Style.PoolAdd_box_price_left_list_item}
                      key={i + 1}
                      onClick={() => (setActive(i + 1), setFee(el.feeSystem))}
                    >
                      <div
                        className={Style.PoolAdd_box_price_left_list_item_info}
                      >
                        <p>{el.fee}</p>
                        <p>
                          {active == i + 1 ? (
                            <Image
                              src={images.tick}
                              alt="image"
                              width={20}
                              height={20}
                            />
                          ) : (
                            ""
                          )}
                        </p>
                      </div>
                      <small>{el.info}</small>
                      <p
                        className={Style.PoolAdd_box_price_left_list_item_para}
                      >
                        {el.number}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* //DEPOSIT AMOUNT */}
            <div className={Style.PoolAdd_box_deposit}>
              <h4>Deposit Amount</h4>
              <div className={Style.PoolAdd_box_deposit_box}>
                <input
                  type="text"
                  placeholder={
                    tokenOneBalance ? tokenOneBalance.slice(0, 9) : ""
                  }
                  value={tokenAmountOne}
                  // onChange={handleTokenAmountOneChange} // 使用防抖逻辑
                  onChange={(e) => setTokenAmountOne(e.target.value)}
                />
                <div className={Style.PoolAdd_box_deposit_box_input}>
                  <p>
                    <Image
                      src={images.etherlogo}
                      alt="image"
                      width={20}
                      height={20}
                    />
                    {tokenOne.symbol || "Ether"}
                  </p>
                </div>
              </div>

              <div className={Style.PoolAdd_box_deposit_box}>
                <input
                  type="text"
                  placeholder={
                    tokenTwoBalance ? tokenTwoBalance.slice(0, 9) : ""
                  }
                  value={tokenAmountTwo}
                  // onChange={handleTokenAmountTwoChange} // 使用防抖逻辑
                  onChange={(e) => setTokenAmountTwo(e.target.value)}
                />
                <div className={Style.PoolAdd_box_deposit_box_input}>
                  <p>
                    <Image
                      src={images.etherlogo}
                      alt="image"
                      width={20}
                      height={20}
                    />
                    {tokenTwo.symbol || "Select"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT */}
          <div className={Style.PoolAdd_box_price_right}>
            <div className={Style.PoolAdd_box_price_right_box}>
              <p className={Style.PoolAdd_box_price_right_box_para}></p>
              <Image src={images.wallet} alt="wallet" height={80} width={80} />
              {/* 显示流动性信息 */}
              <div className={Style.PoolAdd_box_price_left_fee}>
                <div>
                  {Object.keys(liquidityInfos).length > 0 ? (
                    <ul className={Style.liquidityList}>
                      {Object.keys(liquidityInfos).map((poolAddress) =>
                        liquidityInfos[poolAddress].token0 ===
                          tokenOne.symbol &&
                        liquidityInfos[poolAddress].token1 ===
                          tokenTwo.symbol ? (
                          <li key={poolAddress}>
                            <div>
                              <p>
                                {tokenOne.symbol}/{tokenTwo.symbol} liquidity
                                amount is{" "}
                                {formatLiquidity(
                                  liquidityInfos[poolAddress].liquidity
                                )}
                              </p>
                            </div>
                          </li>
                        ) : (
                          <p>
                            {/* No liquidity amount has been found for the current
                            trade. */}
                          </p>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>No liquidity info.</p>
                  )}
                </div>
              </div>
              <h5>Set Range: Number of tick spacings range</h5>
            </div>

            {/* //PRICE RANGE */}

            <div className={Style.PoolAdd_box_price_right_range}>
              <div className={Style.PoolAdd_box_price_right_range_box}>
                <p>Lower Range</p>
                <input
                  className={Style.PoolAdd_box_price_right_range_box_para}
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="0.1"
                  value={rangeLower}
                  onChange={(e) => setRangeLower(e.target.value)}
                />
                <p>
                  {/* {tokenOne.symbol || "ETH"} per {tokenTwo.symbol || "Select"} */}
                  Number of tick spacings below the current tick
                </p>
              </div>
              {/* //MAX */}
              <div className={Style.PoolAdd_box_price_right_range_box}>
                <p>Upper Range</p>
                <input
                  className={Style.PoolAdd_box_price_right_range_box_para}
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="0.1"
                  value={rangeUpper}
                  onChange={(e) => setRangeUpper(e.target.value)}
                />
                <p>
                  {/* {tokenOne.symbol || "ETH"} per {tokenTwo.symbol || "Select"} */}
                  Number of tick spacings above the current tick
                </p>
              </div>
            </div>

            {/* BUTTON */}
            <div className={Style.PoolAdd_box_price_right_amount}>
              <button
                onClick={() => {
                  createPoolAndAddLiquidity({
                    token0: tokenOne,
                    token1: tokenTwo,
                    fee: fee,
                    amount0Desired: tokenAmountOne,
                    amount1Desired: tokenAmountTwo,
                    amount0Min: 0,
                    amount1Min: 0,
                    rangeLower: rangeLower,
                    rangeUpper: rangeUpper,
                    deadline: deadline,
                  }).then(() => {
                    updateLiquidityInfo();
                  });
                }}
              >
                Add Liquidity
              </button>
            </div>
          </div>
        </div>
      </div>
      {openModel && (
        <div className={Style.token}>
          <Token
            setOpenSetting={setOpenModel}
            deadline={deadline}
            setDeadline={setDeadline}
          />
        </div>
      )}
      {openTokenModelOne && (
        <div className={Style.token}>
          <SearchToken
            openToken={setOpenTokenModelOne}
            tokens={setTokenOne}
            poolData={poolData}
            defaultActiveIndex={3}
          />
        </div>
      )}

      {openTokenModelTwo && (
        <div className={Style.token}>
          <SearchToken
            openToken={setOpenTokenModelTwo}
            tokens={setTokenTwo}
            poolData={poolData}
            defaultActiveIndex={4}
          />
        </div>
      )}
    </div>
  );
};

export default PoolAdd;
