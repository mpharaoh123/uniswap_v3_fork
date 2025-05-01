import Image from "next/image";
import React from "react";

//INTERNAL IMPORT
import images from "../../assets";
import Style from "./TokenList.module.css";

const TokenList = ({ setOpenTokenBox }) => {
  return (
    <div className={Style.TokenList}>
      <p
        className={Style.TokenList_close}
        onClick={() => setOpenTokenBox(false)}
      >
        <Image src={images.close} alt="close" width={50} height={50} />
      </p>
      <div className={Style.TokenList_title}>
        <h2>Your Token List</h2>
      </div>

      {tokenDate.map((el, i) => (
        <div className={Style.TokenList_box}>
          <div className={Style.TokenList_box_info}>
            <p className={Style.TokenList_box_info_symbol}>{el.symbol}</p>
            <p>
              <span>{el.tokenBalance.slice(0, 9)}</span> {el.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TokenList;
