import Image from "next/image";
import React, { useState } from "react";

//INTERNAL IMPORT
import images from "../../assets";
import { poolData } from "../../Context/constants";
import Style from "./SearchToken.module.css";

const SearchToken = ({ openToken, tokens, defaultActiveIndex }) => {
  const [active, setActive] = useState(defaultActiveIndex || 1);

  return (
    <div className={Style.SearchToken}>
      <div className={Style.SearchToken_box}>
        <div className={Style.SearchToken_box_heading}>
          <h4>Select a token</h4>
          <Image
            src={images.close}
            alt="close"
            width={60}
            height={60}
            onClick={() => openToken(false)}
            style={{ cursor: "pointer" }}
          />
        </div>

        <div className={Style.SearchToken_box_search}>
          <div className={Style.SearchToken_box_search_img}>
            <Image src={images.search} alt="img" width={20} height={20} />
          </div>
          <input type="text" placeholder="Search name or paste the address" />
        </div>

        <div className={Style.SearchToken_box_tokens}>
          {poolData.map((el, i) => (
            <span
              key={i + 1}
              className={active == i + 1 ? `${Style.active}` : ""}
              onClick={() => (
                setActive(i + 1),
                tokens({
                  name: el.name,
                  image: el.img,
                  symbol: el.symbol,
                  tokenAddress: el.id,
                  decimals: el.decimals,
                }),
                openToken(false)
              )}
            >
              <Image
                src={el.img || images.ether}
                alt="image"
                width={30}
                height={30}
              />
              {el.symbol}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchToken;
