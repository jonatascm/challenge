import { EthPool, EthPool__factory } from "../typechain";

import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;

describe("EthPool", function () {
  let EthPool: EthPool__factory;
  let ethPool: EthPool;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  this.beforeEach(async () => {
    EthPool = await ethers.getContractFactory("EthPool");
    ethPool = await EthPool.deploy();
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  describe("Deploy", async () => {
    it("Should deploy payable contract", async () => {
      await owner.sendTransaction({
        to: ethPool.address,
        value: ethers.utils.parseEther("0.001"),
      });
      expect(await ethers.provider.getBalance(ethPool.address)).to.be.equal(
        ethers.utils.parseEther("0.001")
      );
    });
  });

  describe("Deposit", async () => {
    it("Sucessfully deposit", async () => {
      const depositValue = ethers.utils.parseEther("0.001");
      await ethPool.connect(addr1).depositPool({ value: depositValue });
      expect(await ethPool.totalPool()).to.be.equal(depositValue);
      expect(await ethPool.getUserPool(addr1.address)).to.be.equal(
        depositValue
      );
      expect(await ethPool.getUsersCount()).to.equal(1);
      expect(await ethers.provider.getBalance(ethPool.address)).to.be.equal(
        depositValue
      );
    });

    it("Minimun deposit required", async () => {
      const depositValue = ethers.utils.parseEther("0.00000000000001");
      await expect(
        ethPool.connect(addr2).depositPool({ value: depositValue })
      ).to.be.revertedWith("value must be greater than 10.000 wei");
    });
  });

  describe("Withdraw", async () => {
    it("Sucessfully withdraw only pool", async () => {
      const beginValue = await ethers.provider.getBalance(addr1.address);
      const depositValue = ethers.utils.parseEther("0.001");
      let tx = await ethPool
        .connect(addr1)
        .depositPool({ value: depositValue });
      let receipt = await tx.wait();
      let fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      tx = await ethPool.connect(addr1).withdrawPool();
      receipt = await tx.wait();
      fee = receipt.gasUsed.mul(receipt.effectiveGasPrice).add(fee);
      const endValue = await ethers.provider.getBalance(addr1.address);

      expect(beginValue).to.be.equal(endValue.add(fee));
      expect(await ethers.provider.getBalance(ethPool.address)).to.be.equal(0);
      expect(await ethPool.getUsersCount()).to.equal(0);
      expect(await ethPool.getUserPool(addr1.address)).to.equal(0);
    });

    it("Sucessfully withdraw rewards", async () => {
      const depositValue = ethers.utils.parseEther("0.001");
      const rewardValue = ethers.utils.parseEther("0.1");
      await ethPool.connect(addr1).depositPool({ value: depositValue });
      await ethPool.depositRewards({ value: rewardValue });
      const beginValue = await ethers.provider.getBalance(addr1.address);
      const tx = await ethPool.connect(addr1).withdrawRewards();
      const receipt = await tx.wait();
      const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const endValue = await ethers.provider.getBalance(addr1.address);

      expect(endValue).to.equal(beginValue.add(rewardValue).sub(fee));
      expect(await ethPool.getUserReward(addr1.address)).to.equal(0);
      expect(await ethPool.getUsersCount()).to.equal(1);
    });

    it("Sucessfully withdraw all", async () => {
      const depositValue = ethers.utils.parseEther("0.001");
      const rewardValue = ethers.utils.parseEther("0.1");
      const beginValue = await ethers.provider.getBalance(addr1.address);

      let tx = await ethPool
        .connect(addr1)
        .depositPool({ value: depositValue });
      let receipt = await tx.wait();
      let fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      await ethPool.depositRewards({ value: rewardValue });
      tx = await ethPool.connect(addr1).withdrawPool();
      receipt = await tx.wait();
      fee = receipt.gasUsed.mul(receipt.effectiveGasPrice).add(fee);
      const endValue = await ethers.provider.getBalance(addr1.address);

      expect(endValue).to.equal(beginValue.add(rewardValue).sub(fee));
      expect(await ethPool.getUserReward(addr1.address)).to.equal(0);
      expect(await ethPool.getUserPool(addr1.address)).to.equal(0);
      expect(await ethPool.getUsersCount()).to.equal(0);
    });

    it("Invalid amount to withdraw", async () => {
      await expect(ethPool.connect(addr2).withdrawPool()).to.be.revertedWith(
        "user doesn't have enough to withdraw"
      );
    });
  });

  describe("Restake", async () => {
    it("Sucessfully restake to user's pool", async () => {
      const depositValue = ethers.utils.parseEther("0.001");
      const rewardValue = ethers.utils.parseEther("0.1");
      await ethPool.connect(addr1).depositPool({ value: depositValue });
      await ethPool.depositRewards({ value: rewardValue });
      await ethPool.connect(addr1).restakeRewards();
      expect(await ethPool.getUserPool(addr1.address)).to.be.equal(
        depositValue.add(rewardValue)
      );
      expect(await ethPool.getUserReward(addr1.address)).to.be.equal(0);
    });

    it("Invalid amount to restake", async () => {
      const depositValue = ethers.utils.parseEther("0.001");
      const rewardValue = ethers.utils.parseEther("0.00000000000001");
      await ethPool.connect(addr1).depositPool({ value: depositValue });
      await ethPool.connect(addr2).depositPool({ value: depositValue });
      await ethPool.depositRewards({ value: rewardValue });
      await expect(ethPool.connect(addr1).restakeRewards()).to.be.revertedWith(
        "user doesn't have minimum 10.000 wei to restake"
      );
    });
  });
  describe("Rewards", async () => {
    it("Valid amount separeted to users", async () => {
      const depositValue = ethers.utils.parseEther("0.001");
      const rewardValue = ethers.utils.parseEther("0.00000000000001");
      await ethPool.connect(addr1).depositPool({ value: depositValue });
      await ethPool.connect(addr2).depositPool({ value: depositValue.mul(3) });
      await ethPool.depositRewards({ value: rewardValue });
      expect(await ethPool.getUserReward(addr1.address)).to.be.equal(
        rewardValue.div(4)
      );
      expect(await ethPool.getUserReward(addr2.address)).to.be.equal(
        rewardValue.div(4).mul(3)
      );
    });

    it("Invalid amount to reward", async () => {
      const depositValue = ethers.utils.parseEther("0.001");
      const rewardValue = ethers.utils.parseEther("0.0000000000000001");
      await ethPool.connect(addr1).depositPool({ value: depositValue });
      await expect(
        ethPool.depositRewards({ value: rewardValue })
      ).to.be.revertedWith("value must be greater than 10.000 wei");
    });

    it("Invalid users to reward", async () => {
      const rewardValue = ethers.utils.parseEther("0.00000000000001");
      await expect(
        ethPool.depositRewards({ value: rewardValue })
      ).to.be.revertedWith("there isn't any users in pool");
    });

    it("User isn't from team to deposit reward", async () => {
      const depositValue = ethers.utils.parseEther("0.001");
      const rewardValue = ethers.utils.parseEther("0.00000000000001");
      await ethPool.connect(addr1).depositPool({ value: depositValue });
      await expect(
        ethPool.connect(addr1).depositRewards({ value: rewardValue })
      ).to.be.revertedWith(
        `AccessControl: account ${addr1.address.toLowerCase()} is missing role 0x64b106a1cce9f848ce1a1dffff614f8276d582aa8ba99c9e2d00fc2479e93ca9`
      );
    });
  });
});
