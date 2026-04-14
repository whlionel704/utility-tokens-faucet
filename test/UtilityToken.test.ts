import { expect } from "chai";
import hre from "hardhat";

describe("UtilityToken", function () {
  let utilityToken: any;
  let owner: any;
  let minter: any;
  let nonMinter: any;

  beforeEach(async function () {
    const [ownerSigner, minterSigner, nonMinterSigner] = await hre.ethers.getSigners();
    owner = ownerSigner;
    minter = minterSigner;
    nonMinter = nonMinterSigner;

    // Deploy UtilityToken
    const UtilityTokenFactory = await hre.ethers.getContractFactory("UtilityToken");
    utilityToken = await UtilityTokenFactory.deploy(
      "TestToken",
      "TEST",
      owner.address
    );
    await utilityToken.waitForDeployment();

    // Grant MINTER_ROLE to minter
    const MINTER_ROLE = await utilityToken.MINTER_ROLE();
    await utilityToken.grantRole(MINTER_ROLE, minter.address);
  });

  describe("mintTokens", function () {
    it("Should throw access control error if attempting to call mintTokens using an address which is not the minter role", async function () {
      const amount = hre.ethers.parseUnits("100", 18);
      
      await expect(
        utilityToken.connect(nonMinter).mintTokens(nonMinter.address, amount)
      ).to.be.revertedWithCustomError(utilityToken, "AccessControlUnauthorizedAccount");
    });

    it("Should allow minter to mint tokens", async function () {
      const amount = hre.ethers.parseUnits("100", 18);
      
      await expect(
        utilityToken.connect(minter).mintTokens(minter.address, amount)
      ).to.emit(utilityToken, "TokensMinted");

      const balance = await utilityToken.balanceOf(minter.address);
      expect(balance).to.equal(amount);
    });

    it("Should allow owner to mint tokens", async function () {
      const amount = hre.ethers.parseUnits("100", 18);
      const MINTER_ROLE = await utilityToken.MINTER_ROLE();
      
      // Owner needs to grant themselves the MINTER_ROLE first to mint
      await utilityToken.grantRole(MINTER_ROLE, owner.address);
      
      await expect(
        utilityToken.connect(owner).mintTokens(owner.address, amount)
      ).to.emit(utilityToken, "TokensMinted");

      const balance = await utilityToken.balanceOf(owner.address);
      expect(balance).to.equal(amount);
    });
  });
});
