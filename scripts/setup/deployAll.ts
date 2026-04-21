import {
  keccak256,
  parseEther,
  toBytes
} from "viem";
import UtilityToken from "../../artifacts/contracts/UtilityToken.sol/UtilityToken.json";
import Faucet from "../../artifacts/contracts/Faucet.sol/Faucet.json";
import "dotenv/config";
import { createClients } from "./createClients.js";
import { deployFaucet } from "./deployFaucet.js";
import { deployUtilityToken } from "./deployUtilityToken.js"
import { DeployConfig } from "../types/DeployConfig.js";
import { setTimeout } from 'node:timers/promises';

async function deployAll(config: DeployConfig) {
  const { account, publicClient, walletClient, gasOverrides } = await createClients(config);
  // =====================================================
  // 1. Deploy UtilityToken
  // =====================================================
  const tokenAddress = await deployUtilityToken(
    walletClient,
    publicClient,
    account,
    gasOverrides
  );
  console.log("Utility Token Contract deployed:", tokenAddress);
  await setTimeout(4000);

  // =====================================================
  // 2. Deploy Faucet
  // =====================================================
  const faucetAddress = await deployFaucet(
    walletClient,
    publicClient,
    tokenAddress,
    account,
    gasOverrides
  );
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
  // const faucetOwner = await publicClient.readContract({
  //   address: faucetAddress as `0x${string}`,
  //   abi: Faucet.abi,
  //   functionName: "owner",
  // });

  // const faucetIsGivenMinterRole = await publicClient.readContract({
  //   address: tokenAddress as `0x${string}`,
  //   abi: UtilityToken.abi,
  //   functionName: "hasRole",
  //   args: [MINTER_ROLE, faucetAddress as `0x${string}`],
  // });

  // //console.log("Owner of Faucet contract:", faucetOwner);
  // console.log("Faucet contract has MINTER_ROLE on token contract?", faucetIsGivenMinterRole);

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

export default deployAll;