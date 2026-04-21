import Faucet from "../../artifacts/contracts/Faucet.sol/Faucet.json";
import "dotenv/config";
import { parseEther } from "viem";

export async function deployFaucet(walletClient: any, publicClient: any, tokenAddress: `0x${string}`, account: any, gasOverrides: any) {
  console.log("Token address:", tokenAddress);
  const hash = await walletClient.deployContract({
    abi: Faucet.abi,
    bytecode: Faucet.bytecode as `0x${string}`,
    args: [
      tokenAddress,
      parseEther("0.001"),
      30,
      parseEther("5"),
      account.address,
    ],
    ...gasOverrides
  });
  console.log("Faucet deployment tx hash:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const address = receipt.contractAddress;
  if (!address) throw new Error("Faucet deployment failed");
  return address;
}