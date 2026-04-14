I want to use typescript and viem to write my unit tests for the 2 solidity contracts Faucet and UtilityTokens. The 2 test scripts should be inside the ./test folder. Use the following https://hardhat.org/docs/guides/testing/using-viem as the main reference

Help me to add the required plugins into my hardhat.config.ts

Include the following imports in each test script:

import { describe, it } from "node:test";
import hre from "hardhat";
const { viem, networkHelpers } = await hre.network.connect();

For UtilityTokens, include ONLY the following test cases:
1) Should throw access control error if attempting to call mintTokens using an address which is not the minter role

For Faucet, include ONLY the following test cases:
1) Should throw onlyOwner error if fundFaucet is called with non owner
2) Should throw onlyOwner error if updateClaimAmount is called with non owner
3) should throw onlyOwner error if updateCoolDownDuration is called with non owner
4) should be able to claim faucet with the correct claimAmount if cool-down is over
5) should throw error if user tries to claim faucet if not enough balance in the faucet
6) should throw error if user tries to claim faucet when still in cooldown period

do not add any additional test cases

keep the test scripts as short an concise as possible, having zero unnecessary code