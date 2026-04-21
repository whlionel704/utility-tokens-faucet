import { DeployConfig } from "../types/DeployConfig.js";
import deployAll from "../setup/deployAll.js";
import "dotenv/config";

const config: DeployConfig = {
  chainId: 11155111,
  chainName: "Sepolia",
  chainType: "eip155",
  rpcUrl: process.env.SEPOLIA_RPC_URL!,
  privateKey: process.env.SEPOLIA_TESTNET_ADMIN_PRIVATE_KEY!,
};

deployAll(config).catch(console.error);