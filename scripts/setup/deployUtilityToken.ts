import UtilityToken from "../../artifacts/contracts/UtilityToken.sol/UtilityToken.json";
import "dotenv/config";

export async function deployUtilityToken(walletClient: any, publicClient: any, account: any, gasOverrides: any) {
  const hash = await walletClient.deployContract({
    abi: UtilityToken.abi,
    bytecode: UtilityToken.bytecode as `0x${string}`,
    args: ["UtilityToken", "UTK", account.address],
    ...gasOverrides,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const address = receipt.contractAddress;
  if (!address) throw new Error("Token deployment failed");
  return address;
}