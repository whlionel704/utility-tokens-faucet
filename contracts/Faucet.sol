// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./IUtilityToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Faucet is Ownable {
    IUtilityToken public tokenContract;
    mapping(address => uint256) public lastClaimed;
    
    uint256 public claimAmount;
    uint256 public coolDownDuration; //Simulate 24 hours with 24 seconds for testing
    uint256 public immutable MAX_SUPPLY;

    event FaucetClaimed(address user, uint256 amount, uint256 timestamp);
    event FaucetFunded(uint256 amount, uint256 timestamp);

    constructor(IUtilityToken _tokenContract, uint256 _claimAmount, uint256 _coolDownDuration, uint256 _maxSupply, address _owner)
        Ownable(_owner)
    {
        require(address(_tokenContract) != address(0), "Invalid token");
        tokenContract = _tokenContract;
        claimAmount = _claimAmount;
        coolDownDuration = _coolDownDuration;
        MAX_SUPPLY = _maxSupply;
    }

    function claimFaucet() external {
        require(block.timestamp >= lastClaimed[msg.sender] + coolDownDuration, "Claim too soon. Caller is still in cool-down");
        require(
            tokenContract.balanceOf(address(this)) >= claimAmount,
            "Insufficient tokens in the faucet, please try again later"
        );
        lastClaimed[msg.sender] = block.timestamp;
        bool success = tokenContract.transfer(msg.sender, claimAmount);
        require(success, "Token transfer failed");
        emit FaucetClaimed(msg.sender, claimAmount, block.timestamp);
    }

    function canClaim(address user) external view returns (bool) {
        return block.timestamp >= lastClaimed[user] + coolDownDuration;
    }

    function getLastClaimTime(address user) external view returns (uint256) {
        require(lastClaimed[user] != 0, "User has not claimed tokens yet");
        return lastClaimed[user];
    }

    function getNextClaimTime(address user) external view returns (uint256) {
        if (lastClaimed[user] == 0) {
            return block.timestamp;
        }
        return lastClaimed[user] + coolDownDuration;
    }

    function getTimeRemainingNextClaim(address user) external view returns (uint256) {
        if (block.timestamp >= lastClaimed[user] + coolDownDuration || lastClaimed[user] == 0) {
            return 0;
        }
        return (lastClaimed[user] + coolDownDuration) - block.timestamp;
    }

    //Only the Admin can call these functions:

    function fundFaucet(uint256 amount) external onlyOwner {
        require(MAX_SUPPLY >= tokenContract.balanceOf(address(this)) + amount, "exceeds max supply");
        tokenContract.mintTokens(address(this), amount);
        emit FaucetFunded(amount, block.timestamp);
    }

    function updateClaimAmount(uint256 newAmount) external onlyOwner {
        claimAmount = newAmount;
    }

    function updateCoolDownDuration(uint256 newDuration) external onlyOwner {
        coolDownDuration = newDuration;
    }
}