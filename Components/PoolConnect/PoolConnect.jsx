import Image from "next/image";
import React, { useEffect, useState } from "react";

//INTERNAL IMPORT
import images from "../../assets";
import Style from "./PoolConnect.module.css";

const PoolConnect = ({ setClosePool, account }) => {
  const [liquidityInfos, setLiquidityInfos] = useState({});

  useEffect(() => {
    const liquidityPools =
      JSON.parse(localStorage.getItem("liquidityPools")) || {};
    setLiquidityInfos(liquidityPools);
  }, []);

  const formatLiquidity = (liquidity) => {
    // 使用 toFixed(20) 格式化数值，并移除末尾的零
    const formatted = parseFloat(liquidity).toFixed(20);
    return formatted.replace(/0+$/, "").replace(/\.$/, ""); // 移除末尾的零和点
  };

  return (
    <div className={Style.PoolConnect}>
      <div className={Style.PoolConnect_box}>
        <div className={Style.PoolConnect_box_header}>
          <h2>Pool</h2>
          <p onClick={() => setClosePool(true)}>+ New Position</p>
        </div>

        {!account ? (
          <div className={Style.PoolConnect_box_Middle}>
            <Image src={images.wallet} alt="wallet" height={80} width={80} />
            <p>Your active V3 liquidity positions will appear here.</p>
            <button>Connect Wallet</button>
          </div>
        ) : (
          <div className={Style.PoolConnect_box_liquidity}>
            <div className={Style.PoolConnect_box_liquidity_header}>
              <p>Your Position</p>
            </div>
            {Object.keys(liquidityInfos).length > 0 ? (
              <ul className={Style.PoolConnect_box_liquidity_list}>
                {Object.keys(liquidityInfos).map((poolAddress) => (
                  <li
                    key={poolAddress}
                    className={Style.PoolConnect_box_liquidity_item}
                  >
                    <div>
                      <p>
                        Pair {liquidityInfos[poolAddress].token0}/
                        {liquidityInfos[poolAddress].token1} liquidity is{" "}
                        {formatLiquidity(liquidityInfos[poolAddress].liquidity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No liquidity positions found.</p>
            )}
          </div>
        )}

        <div className={Style.PoolConnect_box_info}>
          <div className={Style.PoolConnect_box_info_left}>
            <h5>Learn about providing liquidity</h5>
            <p>Check out our v3 LP walkthrough and migrate guide</p>
          </div>
          <div className={Style.PoolConnect_box_info_right}>
            <h5>Top pools</h5>
            <p>Explore Uniswap Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolConnect;
