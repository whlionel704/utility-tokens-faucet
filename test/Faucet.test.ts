import { describe, it } from "node:test";
import hre from "hardhat";
import { keccak256, toBytes, getAddress } from "viem";
import assert from "node:assert";
const { viem, networkHelpers } = await hre.network.connect();

describe("Faucet", async function () {
  const CLAIM_AMOUNT = 10n * 10n ** 15n;
  const COOLDOWN_DURATION = 24n;
  const MAX_SUPPLY = 1000000n * 10n ** 18n;
  const FUNDING_AMOUNT = 500n * 10n ** 18n;

  async function getWalletClients() {
    const [user, owner, nonOwner] = await viem.getWalletClients();
    return { user, owner, nonOwner };
  }
  async function deployFixtures() {
    const { owner } = await getWalletClients();
    const utilityToken = await viem.deployContract("UtilityToken", [
      "UtilityToken",
      "UTK",
      owner.account.address,
    ]);
    const faucet = await viem.deployContract("Faucet", [
      utilityToken.address,
      CLAIM_AMOUNT,
      COOLDOWN_DURATION,
      MAX_SUPPLY,
      owner.account.address,
    ]);
    await utilityToken.write.grantRole([keccak256(toBytes("MINTER_ROLE")), faucet.address], { account: owner.account });
    return { utilityToken, faucet };
  };

  describe("onlyOwner functions", function () {
    it("should be able to fund the faucet with the correct amount and correct owner", async function () {
      const { owner } = await getWalletClients();
      const { utilityToken, faucet } = await deployFixtures();
      const before = await utilityToken.read.balanceOf([faucet.address]);
      await faucet.write.fundFaucet([FUNDING_AMOUNT], { account: owner.account });
      const after = await utilityToken.read.balanceOf([faucet.address]);
      assert.strictEqual(after - before, FUNDING_AMOUNT);
      await viem.assertions.emitWithArgs(
        faucet.write.fundFaucet([FUNDING_AMOUNT], { account: owner.account }),
        faucet,
        "FaucetFunded",
        [
          FUNDING_AMOUNT
        ],
      );
    });

    it("Should throw onlyOwner error if fundFaucet is called with non owner", async function () {
      const { nonOwner } = await getWalletClients();
      const { faucet } = await deployFixtures();
      await viem.assertions.revertWithCustomError(
        faucet.write.fundFaucet([FUNDING_AMOUNT], { account: nonOwner.account }),
        faucet,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should throw onlyOwner error if updateClaimAmount is called with non owner", async function () {
      const { nonOwner } = await getWalletClients();
      const { faucet } = await deployFixtures();
      await viem.assertions.revertWithCustomError(
        faucet.write.updateClaimAmount([CLAIM_AMOUNT], { account: nonOwner.account }),
        faucet,
        "OwnableUnauthorizedAccount"
      );
    });

    it("should throw onlyOwner error if updateCoolDownDuration is called with non owner", async function () {
      const { nonOwner } = await getWalletClients();
      const { faucet } = await deployFixtures();
      await viem.assertions.revertWithCustomError(
        faucet.write.updateCoolDownDuration([COOLDOWN_DURATION], { account: nonOwner.account }),
        faucet,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("claimFaucet", function () {
    it("should be able to claim faucet with the correct claimAmount if cool-down is over", async function () {
      const { owner, user } = await getWalletClients();
      const { faucet } = await deployFixtures();
      await faucet.write.fundFaucet([FUNDING_AMOUNT], { account: owner.account });
      await networkHelpers.time.increase(COOLDOWN_DURATION + 1n);
      await viem.assertions.emitWithArgs(
        faucet.write.claimFaucet({ account: user.account }),
        faucet,
        "FaucetClaimed",
        [
          getAddress(user.account.address),
          CLAIM_AMOUNT
        ],
      );
    });

    it("should throw error if user tries to claim faucet if not enough balance in the faucet", async function () {
      const { user, owner } = await getWalletClients();
      const { faucet } = await deployFixtures();
      await faucet.write.fundFaucet([CLAIM_AMOUNT - 100n], { account: owner.account });
      await networkHelpers.time.increase(COOLDOWN_DURATION + 1n);
      await viem.assertions.revertWith(
        faucet.write.claimFaucet({ account: user.account }),
        "Insufficient tokens in the faucet, please try again later"
      );
    });

    it("should throw error if user tries to claim faucet when still in cooldown period", async function () {
      const { owner, user } = await getWalletClients();
      const { faucet } = await deployFixtures();
      await faucet.write.fundFaucet([FUNDING_AMOUNT], { account: owner.account });
      await faucet.write.claimFaucet({ account: user.account }),
      await networkHelpers.time.increase(COOLDOWN_DURATION - 10n);
      await viem.assertions.revertWith(
        faucet.write.claimFaucet({ account: user.account }),
        "Claim too soon. Caller is still in cool-down"
      );
    });
  });
});