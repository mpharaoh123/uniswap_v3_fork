import Image from "next/image";
import React, { useContext, useEffect, useState, useRef } from "react";

// INTERNAL IMPORT
import images from "../../assets";
import { SearchToken, Token } from "../../Components/index.js";
import Style from "./PoolAdd.module.css";

import { SwapTokenContext } from "../../Context/SwapContext";

const PoolAdd = ({ setClosePool, createLiquidityAndPool }) => {
  const [openModel, setOpenModel] = useState(false);
  const [openTokenModelOne, setOpenTokenModelOne] = useState(false);
  const [openTokenModelTwo, setOpenTokenModelTwo] = useState(false);
  const [active, setActive] = useState(1);
  const [openFee, setOpenFee] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);

  // NEW STATE
  const [fee, setFee] = useState(500);
  const [slippage, setSlippage] = useState(25);
  const [deadline, setDeadline] = useState(10);
  const [tokenAmountOne, setTokenAmountOne] = useState(null);
  const [tokenAmountTwo, setTokenAmountTwo] = useState(null);
  const tokenOneTimeoutRef = useRef(null); // 用于第一个输入框的定时器
  const tokenTwoTimeoutRef = useRef(null); // 用于第二个输入框的定时器

  const { tokenData, getPrice } = useContext(SwapTokenContext);

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

  const feePairs = [
    {
      fee: "0.05%",
      number: "0% Select",
      feeSystem: 500,
    },
    {
      fee: "0.3%",
      number: "0% Select",
      feeSystem: 3000,
    },
    {
      fee: "1%",
      number: "0% Select",
      feeSystem: 10000,
    },
  ];

  useEffect(() => {
    console.log("TokenAmountTwo updated:", tokenAmountTwo);
  }, [tokenAmountTwo]);

  useEffect(() => {
    console.log("tokenData", tokenData);
    if (tokenData.length > 0) {
      // console.log("hero section tokenData:", tokenData);
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
    // console.log(111, tokenOne);
    // console.log(222, tokenTwo);
  }, [tokenData]);

  // Effect to calculate the other token amount when one token amount changes
  useEffect(() => {
    const calculateOtherTokenAmount = async () => {
      if (
        tokenAmountOne > 0 &&
        tokenOne.tokenAddress &&
        tokenTwo.tokenAddress &&
        fee
      ) {
        const amountOut = await getPrice(
          tokenAmountOne,
          tokenOne,
          tokenTwo,
          fee
        );
        setTokenAmountTwo(amountOut);
      } else if (
        tokenAmountTwo > 0 &&
        tokenOne.tokenAddress &&
        tokenTwo.tokenAddress &&
        fee
      ) {
        const amountOut = await getPrice(
          tokenAmountTwo,
          tokenTwo,
          tokenOne,
          fee
        );
        setTokenAmountOne(amountOut);
      }
    };

    calculateOtherTokenAmount();
  }, [tokenAmountOne, tokenAmountTwo, tokenOne, tokenTwo, fee]);

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
            />
          </div>
          <div className={Style.PoolAdd_box_header_middle}>
            <p>Add Liquidity</p>
          </div>
          <div className={Style.PoolAdd_box_header_right}>
            <p>
              {tokenOne.name || ""} {tokenOne.tokenBalance.slice(0, 9) || ""}
              {"    "}
              {tokenTwo.name || ""} {tokenTwo.tokenBalance.slice(0, 9) || ""}
            </p>
            <Image
              src={images.close}
              alt="image"
              width={50}
              height={50}
              onClick={() => setOpenModel(true)}
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
                <p>{tokenOne.name || "ETH"}</p>
                <p>🡫</p>
              </div>
              <div
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
                <p>{tokenTwo.name || "Select"}</p>
                <p>🡫</p>
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
                    <p className={Style.PoolAdd_box_price_left_list_item_para}>
                      {el.number}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* //DEPOSIT AMOUNT */}
            <div className={Style.PoolAdd_box_deposit}>
              <h4>Deposit Amount</h4>
              <div className={Style.PoolAdd_box_deposit_box}>
                <input
                  type="number"
                  placeholder={tokenOne.tokenBalance.slice(0, 9)}
                  value={tokenAmountOne}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTokenAmountOne(value);
                    // 清除之前的定时器
                    clearTimeout(tokenOneTimeoutRef.current);
                    // 设置新的定时器
                    tokenOneTimeoutRef.current = setTimeout(async () => {
                      if (value > 0 && tokenTwo.tokenAddress && fee > 0) {
                        const amountOut = await getPrice(
                          value,
                          tokenOne,
                          tokenTwo,
                          fee
                        );
                        console.log("amountOut", amountOut);
                        setTokenAmountTwo(amountOut);
                      }
                    }, 1000); // 延迟1秒
                  }}
                />
                <div className={Style.PoolAdd_box_deposit_box_input}>
                  <p>
                    <small>{tokenOne.name || "ETH"}</small> {""}{" "}
                    {tokenOne.symbol || "Ether"}
                  </p>
                </div>
              </div>

              <div className={Style.PoolAdd_box_deposit_box}>
                <input
                  type="number"
                  placeholder={tokenTwo.tokenBalance.slice(0, 9)}
                  value={tokenAmountTwo}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTokenAmountTwo(value);
                    // 清除之前的定时器
                    clearTimeout(tokenTwoTimeoutRef.current);
                    // 设置新的定时器
                    tokenTwoTimeoutRef.current = setTimeout(async () => {
                      if (value > 0 && tokenOne.tokenAddress && fee > 0) {
                        const amountOut = await getPrice(
                          value,
                          tokenTwo,
                          tokenOne,
                          fee
                        );
                        console.log("amountOut", amountOut);
                        setTokenAmountOne(amountOut);
                      }
                    }, 1000); // 延迟1秒
                  }}
                />
                <div className={Style.PoolAdd_box_deposit_box_input}>
                  <p>
                    <small>{tokenTwo.name || "ETH"}</small> {""}{" "}
                    {tokenTwo.symbol || "Select"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT */}
          <div className={Style.PoolAdd_box_price_right}>
            <h4>Set Price Range</h4>
            <div className={Style.PoolAdd_box_price_right_box}>
              <p className={Style.PoolAdd_box_price_right_box_para}>
                Current Price: {tokenOne.name || "ETH"} per{" "}
                {tokenTwo.name || "Select"}
              </p>
              <Image src={images.wallet} alt="wallet" height={80} width={80} />
              <h3>Your position will appear here.</h3>
            </div>

            {/* //PRICE RANGE */}

            <div className={Style.PoolAdd_box_price_right_range}>
              <div className={Style.PoolAdd_box_price_right_range_box}>
                <p>Min Price</p>
                <input
                  type="number"
                  placeholder="0.000"
                  min="0.00"
                  step="0.001"
                  className={Style.PoolAdd_box_price_right_range_box_para}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <p>
                  {tokenOne.name || "ETH"} per {tokenTwo.name || "Select"}
                </p>
              </div>
              {/* //MAX */}
              <div className={Style.PoolAdd_box_price_right_range_box}>
                <p>Max Price</p>
                <input
                  type="number"
                  placeholder="0.000"
                  min="0.000"
                  step="0.001"
                  className={Style.PoolAdd_box_price_right_range_box_para}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
                <p>
                  {" "}
                  {tokenOne.name || "ETH"} per {tokenTwo.name || "Select"}
                </p>
              </div>
            </div>

            {/* BUTTON */}
            <div className={Style.PoolAdd_box_price_right_amount}>
              <button
                onClick={() => {
                  createLiquidityAndPool({
                    token0: tokenOne,
                    token1: tokenTwo,
                    fee: fee,
                    amount0Desired: tokenAmountOne,
                    amount1Desired: tokenAmountTwo,
                    slippage: slippage,
                    amount0Min: minPrice,
                    amount1Min: maxPrice,
                    deadline: deadline,
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
            setSlippage={setSlippage}
            slippage={slippage}
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
            tokenData={tokenData}
            defaultActiveIndex={3}
          />
        </div>
      )}

      {openTokenModelTwo && (
        <div className={Style.token}>
          <SearchToken
            openToken={setOpenTokenModelTwo}
            tokens={setTokenTwo}
            tokenData={tokenData}
            defaultActiveIndex={10}
          />
        </div>
      )}
    </div>
  );
};

export default PoolAdd;
