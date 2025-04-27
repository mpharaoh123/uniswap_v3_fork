import React, { useContext, useState } from "react";

//INTERNAL IMPORT
import Style from "../styles/Pools.module.css";

import { PoolAdd, PoolConnect } from "../Components/index";
import { SwapTokenContext } from "../Context/SwapContext";

const Pool = () => {
  const { account, createPoolAndAddLiquidity, tokenData, getAllLiquidity } =
    useContext(SwapTokenContext);

  const [closePool, setClosePool] = useState(true); //todo false

  return (
    <div className={Style.Pool}>
      {closePool ? (
        <PoolAdd
          account={account}
          setClosePool={setClosePool}
          tokenData={tokenData}
          createPoolAndAddLiquidity={createPoolAndAddLiquidity}
        />
      ) : (
        <PoolConnect
          setClosePool={setClosePool}
          getAllLiquidity={getAllLiquidity}
          account={account}
        />
      )}
    </div>
  );
};

export default Pool;
