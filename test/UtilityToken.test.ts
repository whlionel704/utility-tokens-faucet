import { describe, it } from "node:test";
import hre from "hardhat";

const { viem } = await hre.network.connect();

describe("UtilityToken", function () {
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
