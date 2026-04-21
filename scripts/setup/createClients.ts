import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from "viem";
import { DeployConfig } from "../types/DeployConfig.js";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";
import { getGasOverrides } from "../utils/gasOverrides.js";

// =====================================================
// Factory function
// =====================================================
export async function createClients(config: DeployConfig) {
  const chain = defineChain({
    id: config.chainId,
    name: config.chainName,
    network: config.chainName,
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: [config.rpcUrl],
      },
    },
  });

  const account = privateKeyToAccount(`0x${config.privateKey}`);
  const transport = http(config.rpcUrl);
  const publicClient = createPublicClient({
    chain,
    transport,
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const gasOverrides = await getGasOverrides(config);
  return {
    account,
    publicClient,
    walletClient,
    gasOverrides
  }
}