import { describe, it } from "node:test";
import assert from "node:assert";
import hre from "hardhat";
import { keccak256, toBytes, getAddress } from "viem";

const { viem } = await hre.network.connect();

describe("UtilityToken", function () {
  it.only("Should allow minter to mint tokens successfully", async () => {
    const [admin, minter] = await viem.getWalletClients();

    const utilityToken = await viem.deployContract("UtilityToken", [
      "UtilityToken",
      "UTK",
      admin.account.address,
    ]);

    await utilityToken.write.grantRole([keccak256(toBytes("MINTER_ROLE")), minter.account.address], { account: admin.account });

    await viem.assertions.emitWithArgs(
      utilityToken.write.mintTokens(
        [minter.account.address, 1000n],
        { account: minter.account }
      ),
      utilityToken,
      "TokensMinted",
      [
        getAddress(minter.account.address),
        1000n
      ]
    );
  });

  it("Should throw access control error if attempting to call mintTokens using an address which is not the minter role", async () => {
    const [admin, nonMinter] = await viem.getWalletClients();
    const utilityToken = await viem.deployContract("UtilityToken", [
      "UtilityToken",
      "UTK",
      admin.account.address,
    ]);
    await viem.assertions.revertWithCustomError(
      utilityToken.write.mintTokens([nonMinter.account.address, 1000n], { account: admin.account }),
      utilityToken,
      "AccessControlUnauthorizedAccount"
    );
  });
});
