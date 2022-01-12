import { ethers } from "hardhat";

async function main() {
  const EthPool = await ethers.getContractFactory("EthPool");
  const ethPool = await EthPool.deploy();
  await ethPool.deployed();
  console.log("EthPool deployed to:", ethPool.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
