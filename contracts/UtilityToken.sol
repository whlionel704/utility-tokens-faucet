// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract UtilityToken is ERC20, AccessControl {

    /// @notice role that can mint tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice emitted when tokens are minted
    event TokensMinted(address indexed minter, uint256 amount);

    /**
     * @dev Constructor
     *
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _owner Contract owner address
     *
     * initialSupply is expressed in whole tokens.
     * It will be scaled by decimals() automatically.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _owner
    )
        ERC20(_name, _symbol)
    {
        require(_owner != address(0), "Invalid owner");
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
    }

    /**
     * @notice Mint tokens
     * @param amount Amount to mint (in smallest unit)
     * @param to Address to mint tokens to
     */
    function mintTokens(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
}