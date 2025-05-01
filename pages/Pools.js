import React, { useContext, useState } from "react";

//INTERNAL IMPORT
import Style from "../styles/Pools.module.css";

import { PoolAdd, PoolConnect } from "../Components/index";
import { SwapTokenContext } from "../Context/SwapContext";

const Pool = () => {
  const { createPoolAndAddLiquidity } = useContext(SwapTokenContext);

  const [closePool, setClosePool] = useState(false); //todo false

  return (
    <div className={Style.Pool}>
      {closePool ? (
        <PoolAdd
          setClosePool={setClosePool}
          createPoolAndAddLiquidity={createPoolAndAddLiquidity}
        />
      ) : (
        <PoolConnect setClosePool={setClosePool} />
      )}
    </div>
  );
};

export default Pool;
