import { describe, it } from "node:test";
import hre from "hardhat";
import { keccak256, toBytes, getAddress } from "viem";

const { viem } = await hre.network.connect();

describe("UtilityToken", function () {
  async function getWalletClients() {
    const [admin, minter, nonMinter] = await viem.getWalletClients();
    return { admin, minter, nonMinter };
  }
  async function deployFixtures() {
    const { admin } = await getWalletClients();
    const utilityToken = await viem.deployContract("UtilityToken", [
      "UtilityToken",
      "UTK",
      admin.account.address,
    ]);
    return { utilityToken };
  }

  it("Should allow minter to mint tokens successfully", async () => {
    const { admin, minter } = await getWalletClients();
    const { utilityToken }= await deployFixtures();

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
    const { admin, nonMinter } = await getWalletClients();
    const { utilityToken }= await deployFixtures();
    await viem.assertions.revertWithCustomError(
      utilityToken.write.mintTokens([nonMinter.account.address, 1000n], { account: admin.account }),
      utilityToken,
      "AccessControlUnauthorizedAccount"
    );
  });
});
