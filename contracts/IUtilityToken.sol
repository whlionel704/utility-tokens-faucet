// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUtilityToken is IERC20 {
    function mintTokens(address to, uint256 amount) external;
}