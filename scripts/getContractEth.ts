import { ethers } from "hardhat";

async function main() {
  if (process.env.DEPLOYED_CONTRACT_ADDRESS === "") {
    console.log("Please add DEPLOYED_CONTRACT_ADDRESS to .env file");
  }
  const ethPool = await ethers.getContractAt(
    "EthPool",
    process.env.DEPLOYED_CONTRACT_ADDRESS || ""
  );

  const bigBalance = await ethers.provider.getBalance(ethPool.address);
  const formatedBalance = ethers.utils.formatEther(bigBalance);

  console.log("EthPool contract balance: ", formatedBalance);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
