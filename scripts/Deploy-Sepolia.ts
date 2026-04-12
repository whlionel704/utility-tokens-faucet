import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256, 
  parseEther,
  toBytes 
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import UtilityToken from "../artifacts/contracts/UtilityToken.sol/UtilityToken.json";
import Faucet from "../artifacts/contracts/Faucet.sol/Faucet.json";
import "dotenv/config";

const account = privateKeyToAccount(`0x${process.env.SEPOLIA_TESTNET_ADMIN_PRIVATE_KEY!}`);
console.log('🚀 Starting deployments...');

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

async function main() {
  console.log("Deploying contracts with admin account:", account.address);

  // =====================================================
  // 1. Deploy UtilityToken
  // =====================================================
  const tokenHash = await walletClient.deployContract({
    abi: UtilityToken.abi,
    bytecode: UtilityToken.bytecode as `0x${string}`,
    args: ["UtilityToken", "UTK", account.address],
  });

  const tokenReceipt = await publicClient.waitForTransactionReceipt({
    hash: tokenHash,
  });

  const tokenAddress = tokenReceipt.contractAddress;
  console.log("Utility Token Contract deployed:", tokenAddress);

  // =====================================================
  // 2. Deploy Faucet
  // =====================================================
  const faucetHash = await walletClient.deployContract({
    abi: Faucet.abi,
    bytecode: Faucet.bytecode as `0x${string}`,
    args: [
      tokenAddress,
      parseEther("0.001"),
      30,
      parseEther("5"),
      account.address,
    ],
  });

  const faucetReceipt = await publicClient.waitForTransactionReceipt({
    hash: faucetHash,
  });

  const faucetAddress = faucetReceipt.contractAddress;
  console.log("Faucet deployed:", faucetAddress);

  // =====================================================
  // 3. Grant MINTER_ROLE to Faucet
  // =====================================================
  const MINTER_ROLE = keccak256(toBytes("MINTER_ROLE"));
  const grantTx = await walletClient.writeContract({
    address: tokenAddress as `0x${string}`,
    abi: UtilityToken.abi,
    functionName: "grantRole",
    args: [MINTER_ROLE, faucetAddress as `0x${string}`],
  });

  await publicClient.waitForTransactionReceipt({ hash: grantTx });

  console.log("Granted MINTER_ROLE to faucet contract address");

  // =====================================================
  // 4. Verify roles
  // =====================================================
  const faucetOwner = await publicClient.readContract({
    address: faucetAddress as `0x${string}`,
    abi: Faucet.abi,
    functionName: "owner",
  });

  const faucetIsGivenMinterRole = await publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: UtilityToken.abi,
    functionName: "hasRole",
    args: [MINTER_ROLE, faucetAddress as `0x${string}`],
  });

  console.log("Owner of Faucet contract:", faucetOwner);
  console.log("Faucet contract has MINTER_ROLE on token contract?", faucetIsGivenMinterRole);

  // =====================================================
  // 5. Fund faucet
  // =====================================================
  const fundTx = await walletClient.writeContract({
    address: faucetAddress as `0x${string}`,
    abi: Faucet.abi,
    functionName: "fundFaucet",
    args: [parseEther("5")],
  });

  await publicClient.waitForTransactionReceipt({ hash: fundTx });
  console.log("Faucet funded!");
}

main().catch(console.error);