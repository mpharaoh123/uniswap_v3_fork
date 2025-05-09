import Image from "next/image";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";

//IMPORT INTERNAL
import images from "../../assets";
import { Model } from "../index";
import Style from "./NavBar.module.css";

//CONTEXT
import { SwapTokenContext } from "../../Context/SwapContext";

const NavBar = () => {
  const { account, networkConnect, connectWallet } =
    useContext(SwapTokenContext);
  const menuItems = [
    {
      name: "Swap",
      link: "/",
    },
    {
      name: "Tokens",
      link: "/Tokens",
    },
    {
      name: "Pools",
      link: "/Pools",
    },
  ];
  //USESTATE
  const [openModel, setOpenModel] = useState(false);
  const [openTokenBox, setOpenTokenBox] = useState(false);

  return (
    <div className={Style.NavBar}>
      <div className={Style.NavBar_box}>
        <div className={Style.NavBar_box_left}>
          {/* //LOGO IMAGE  */}
          <div className={Style.NavBar_box_left_img}>
            <Image src={images.uniswap} alt="logo" width={50} height={50} />
          </div>
          {/* MENU ITEMS */}

          <div className={Style.NavBar_box_left_menu}>
            {menuItems.map((el, i) => (
              <Link key={i + 1} href={{ pathname: `${el.link}` }}>
                <p className={Style.NavBar_box_left_menu_item}>{el.name}</p>
              </Link>
            ))}
          </div>
        </div>
        {/* //RIGHT SECTION */}
        <div className={Style.NavBar_box_right}>
          <div className={Style.NavBar_box_right_box}>
            <div className={Style.NavBar_box_right_box_img}>
              <Image src={images.ether} alt="NetWork" height={30} width={30} />
            </div>
            <p>{networkConnect}</p>
          </div>
          {account ? (
            <button onClick={() => setOpenTokenBox(true)}>
              {account.slice(0, 7) + "..." + account.slice(-5)}
            </button>
          ) : (
            <button onClick={() => setOpenModel(true)}>Connect</button>
          )}

          {openModel && (
            <Model setOpenModel={setOpenModel} connectWallet={connectWallet} />
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
