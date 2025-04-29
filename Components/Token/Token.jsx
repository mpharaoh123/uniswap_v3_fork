import Image from "next/image";
import React from "react";

//IMPORT INTERNAL
import images from "../../assets";
import Style from "./Token.module.css";

const Token = ({ setOpenSetting, deadline, setDeadline }) => {
  return (
    <div className={Style.Token}>
      <div className={Style.Token_box}>
        <div className={Style.Token_box_heading}>
          <h4>Setting</h4>
          <Image
            src={images.close}
            alt="close"
            width={50}
            height={50}
            onClick={() => setOpenSetting(false)}
          />
        </div>

        <div className={Style.Token_box_input}>
          <span className={Style.Token_box_input_label}>Deatline Time</span>
          <input
            type="text"
            placeholder={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={Style.Token_box_input_field}
          />
          <button className={Style.Token_box_input_button}>minutes</button>
        </div>
      </div>
    </div>
  );
};

export default Token;
