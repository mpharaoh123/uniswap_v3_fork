import Image from "next/image";
import React from "react";

//IMPORT INTERNAL
import images from "../../assets";
import Style from "./TokenSwap.module.css";

const TokenSwap = ({
  setOpenSetting,
  slippage,
  setSlippage,
  deadline,
  setDeadline,
}) => {
  return (
    <div className={Style.Token}>
      <div className={Style.Token_box}>
        <div className={Style.Token_box_heading}>
          <h4>Setting</h4>
          <Image
            src={images.close}
            alt="close"
            width={60}
            height={60}
            onClick={() => setOpenSetting(false)}
            style={{ cursor: "pointer" }}
          />
        </div>
        <p className={Style.Token_box_para}>Slippage tolerance{""}</p>

        <div className={Style.Token_box_input}>
          <button onClick={() => setSlippage(0.05)}>Auto</button>
          <input
            type="text"
            value={slippage}
            onChange={(e) => {
              const value = e.target.value;
              if (value > 1) alert("Value cannot exceed 1.");
              else setSlippage(e.target.value);
            }}
          />
        </div>

        <p className={Style.Token_box_para}>Deadline Time{""}</p>

        <div className={Style.Token_box_input}>
          <input
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div>minutes</div>
        </div>
      </div>
    </div>
  );
};

export default TokenSwap;
