import { DeployConfig } from "../types/DeployConfig.js";

export async function getGasOverrides(
  config: DeployConfig,
) {

  if (config.chainName === "besu") {
    return {
      gas: 8_000_000n,
      type: "legacy",
      gasPrice: 1n
    };
  }

  return {};
}