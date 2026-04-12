import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, ".env") });

export default {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [`0x${process.env.SEPOLIA_TESTNET_ADMIN_PRIVATE_KEY}`],
    },
    //If you do not use a Besu network, remove or comment out the block below.
    besu: {
      type: "http",
      url: process.env.HOST_URL,
      accounts: [
        `0x${process.env.ALLOC_1_PRIVATE_KEY}`,
        `0x${process.env.ALLOC_2_PRIVATE_KEY}`,
        `0x${process.env.ALLOC_3_PRIVATE_KEY}`
      ]
    }
  },
};
