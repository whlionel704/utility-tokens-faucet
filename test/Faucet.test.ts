import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";
import UtilityToken from "../artifacts/contracts/UtilityToken.sol/UtilityToken.json";
import Faucet from "../artifacts/contracts/Faucet.sol/Faucet.json";

describe("Faucet", function () {
  let utilityToken: UtilityToken;
  let faucet: Faucet;
  let owner: any;
  let user1: any;
  let user2: any;
  let nonOwner: any;

  const CLAIM_AMOUNT = hre.ethers.parseUnits("10", 18);
  const COOLDOWN_DURATION = 24; // 24 seconds for testing (simulates 24 hours)
  const MAX_SUPPLY = hre.ethers.parseUnits("1000000", 18);
  const FUNDING_AMOUNT = hre.ethers.parseUnits("500", 18);

  beforeEach(async function () {
    const [ownerSigner, user1Signer, user2Signer, nonOwnerSigner] = await hre.ethers.getSigners();
    owner = ownerSigner;
    user1 = user1Signer;
    user2 = user2Signer;
    nonOwner = nonOwnerSigner;

    // Deploy UtilityToken
    const UtilityTokenFactory = await hre.ethers.getContractFactory("UtilityToken");
    utilityToken = await UtilityTokenFactory.deploy(
      "TestToken",
      "TEST",
      owner.address
    );
    await utilityToken.waitForDeployment();

    // Grant MINTER_ROLE to faucet (will be set after faucet deployment)
    const MINTER_ROLE = await utilityToken.MINTER_ROLE();
    
    // Deploy Faucet
    const FaucetFactory = await hre.ethers.getContractFactory("Faucet");
    faucet = await FaucetFactory.deploy(
      await utilityToken.getAddress(),
      CLAIM_AMOUNT,
      COOLDOWN_DURATION,
      MAX_SUPPLY,
      owner.address
    );
    await faucet.waitForDeployment();

    // Grant MINTER_ROLE to faucet
    await utilityToken.grantRole(MINTER_ROLE, await faucet.getAddress());
  });

  describe("fundFaucet", function () {
    it("Should throw onlyOwner error if fundFaucet is called with non owner", async function () {
      await expect(
        faucet.connect(nonOwner).fundFaucet(FUNDING_AMOUNT)
      ).to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to fund faucet", async function () {
      await expect(
        faucet.connect(owner).fundFaucet(FUNDING_AMOUNT)
      ).to.emit(faucet, "FaucetFunded");

      const balance = await utilityToken.balanceOf(await faucet.getAddress());
      expect(balance).to.equal(FUNDING_AMOUNT);
    });
  });

  describe("updateClaimAmount", function () {
    it("Should throw onlyOwner error if updateClaimAmount is called with non owner", async function () {
      const newAmount = hre.ethers.parseUnits("20", 18);
      
      await expect(
        faucet.connect(nonOwner).updateClaimAmount(newAmount)
      ).to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to update claim amount", async function () {
      const newAmount = hre.ethers.parseUnits("20", 18);
      
      await faucet.connect(owner).updateClaimAmount(newAmount);
      const claimAmount = await faucet.claimAmount();
      expect(claimAmount).to.equal(newAmount);
    });
  });

  describe("updateCoolDownDuration", function () {
    it("should throw onlyOwner error if updateCoolDownDuration is called with non owner", async function () {
      const newDuration = 48;
      
      await expect(
        faucet.connect(nonOwner).updateCoolDownDuration(newDuration)
      ).to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount");
    });

    it("should allow owner to update cooldown duration", async function () {
      const newDuration = 48;
      
      await faucet.connect(owner).updateCoolDownDuration(newDuration);
      const cooldownDuration = await faucet.coolDownDuration();
      expect(cooldownDuration).to.equal(newDuration);
    });
  });

  describe("claimFaucet", function () {
    beforeEach(async function () {
      // Fund the faucet before each test
      await faucet.connect(owner).fundFaucet(FUNDING_AMOUNT);
    });

    it("should be able to claim faucet with the correct claimAmount if cool-down is over", async function () {
      // First claim
      await expect(
        faucet.connect(user1).claimFaucet()
      ).to.emit(faucet, "FaucetClaimed").withArgs(user1.address, CLAIM_AMOUNT, await time.latest());

      let balance = await utilityToken.balanceOf(user1.address);
      expect(balance).to.equal(CLAIM_AMOUNT);

      // Advance time past cooldown
      await time.increase(COOLDOWN_DURATION);

      // Second claim should succeed
      const tx = faucet.connect(user1).claimFaucet();
      await expect(tx).to.emit(faucet, "FaucetClaimed");

      balance = await utilityToken.balanceOf(user1.address);
      expect(balance).to.equal(CLAIM_AMOUNT * 2n);
    });

    it("should throw error if user tries to claim faucet if not enough balance in the faucet", async function () {
      // Drain the faucet by claiming with multiple users
      const claimsNeeded = FUNDING_AMOUNT / CLAIM_AMOUNT + 1n;

      for (let i = 0; i < claimsNeeded; i++) {
        const [, u] = await hre.ethers.getSigners();
        
        if (i < Number(claimsNeeded) - 1) {
          await faucet.connect(u).claimFaucet();
          // Advance time for next user
          await time.increase(COOLDOWN_DURATION);
        } else {
          // Last claim should fail due to insufficient balance
          await expect(
            faucet.connect(u).claimFaucet()
          ).to.be.revertedWith("Insufficient tokens in the faucet, please try again later");
        }
      }
    });

    it("should throw error if user tries to claim faucet when still in cooldown period", async function () {
      // First claim
      await faucet.connect(user1).claimFaucet();

      // Attempt to claim before cooldown is over
      await expect(
        faucet.connect(user1).claimFaucet()
      ).to.be.revertedWith("Claim too soon. Caller is still in cool-down");

      // Advance time to just before cooldown ends
      await time.increase(COOLDOWN_DURATION - 1);

      // Still should fail
      await expect(
        faucet.connect(user1).claimFaucet()
      ).to.be.revertedWith("Claim too soon. Caller is still in cool-down");

      // Advance past cooldown
      await time.increase(1);

      // Now should succeed
      await expect(
        faucet.connect(user1).claimFaucet()
      ).to.emit(faucet, "FaucetClaimed");
    });

    it("should allow different users to claim independently", async function () {
      // User1 claims
      await faucet.connect(user1).claimFaucet();
      let balance1 = await utilityToken.balanceOf(user1.address);
      expect(balance1).to.equal(CLAIM_AMOUNT);

      // User2 can claim immediately (different cooldown tracking)
      await faucet.connect(user2).claimFaucet();
      let balance2 = await utilityToken.balanceOf(user2.address);
      expect(balance2).to.equal(CLAIM_AMOUNT);

      // Both should have claimed successfully
      const faucetBalance = await utilityToken.balanceOf(await faucet.getAddress());
      expect(faucetBalance).to.equal(FUNDING_AMOUNT - (CLAIM_AMOUNT * 2n));
    });
  });
});
