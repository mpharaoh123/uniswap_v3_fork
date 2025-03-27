const fs = require("fs");
const { promisify } = require("util");

async function main() {

  Shoaib = await ethers.getContractFactory("Shoaib");
  shoaib = await Shoaib.deploy();

  Rayyan = await ethers.getContractFactory("Rayyan");
  rayyan = await Rayyan.deploy();

  PopUp = await ethers.getContractFactory("PopUp");
  popUp = await PopUp.deploy();

  console.log("shoaibAddress=", `'${shoaib.address}'`);
  console.log("rayyanAddrss=", `'${rayyan.address}'`);
  console.log("popUpAddress=", `'${popUp.address}'`);

  let addresses = [
    `shoaibAddress=${shoaib.address}`,
    `rayyanAddrss=${rayyan.address}`,
    `popUpAddress=${popUp.address}`,
  ];
  const data = "\n" + addresses.join("\n");

  const writeFile = promisify(fs.appendFile);
  const filePath = ".env";
  return writeFile(filePath, data)
    .then(() => {
      console.log("Addresses recorded.");
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}

/*
  npx hardhat run --network localhost scripts/02_deployTokens.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
