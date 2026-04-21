import { DeployConfig } from "../types/DeployConfig.js";
import deployAll from "../setup/deployAll.js";
import "dotenv/config";

const config: DeployConfig = {
  chainId: 1337,
  chainName: "besu",
  chainType: "eip155",
  rpcUrl: process.env.HOST_URL!,
  privateKey: process.env.ALLOC_1_PRIVATE_KEY!,
};

deployAll(config).catch(console.error);