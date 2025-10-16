// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EduFundRewards
 * @dev Smart contract for distributing mUSD rewards to quest completers
 */
contract EduFundRewards is Ownable, ReentrancyGuard {
    IERC20 public musdToken;
    
    // Quest ID => User Address => Claimed status
    mapping(bytes32 => mapping(address => bool)) public questClaimed;
    
    // Track total rewards distributed
    uint256 public totalRewardsDistributed;
    
    // Events
    event RewardClaimed(
        address indexed user,
        bytes32 indexed questId,
        uint256 amount,
        uint256 timestamp
    );
    
    event TokensDeposited(address indexed from, uint256 amount);
    event TokensWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _musdToken) Ownable(msg.sender) {
        require(_musdToken != address(0), "Invalid mUSD token address");
        musdToken = IERC20(_musdToken);
    }
    
    /**
     * @dev Claim reward for completing a quest
     * @param questId Unique identifier for the quest
     * @param amount Amount of mUSD to claim
     * @param signature Backend signature proving quest completion
     */
    function claimReward(
        bytes32 questId,
        uint256 amount,
        bytes memory signature
    ) external nonReentrant {
        require(!questClaimed[questId][msg.sender], "Reward already claimed");
        require(amount > 0, "Amount must be greater than 0");
        
        // Verify signature from backend (proves quest was completed)
        require(
            _verifySignature(questId, msg.sender, amount, signature),
            "Invalid signature"
        );
        
        // Check contract has enough mUSD
        require(
            musdToken.balanceOf(address(this)) >= amount,
            "Insufficient contract balance"
        );
        
        // Mark as claimed
        questClaimed[questId][msg.sender] = true;
        totalRewardsDistributed += amount;
        
        // Transfer mUSD to user
        require(
            musdToken.transfer(msg.sender, amount),
            "Transfer failed"
        );
        
        emit RewardClaimed(msg.sender, questId, amount, block.timestamp);
    }
    
    /**
     * @dev Check if user has claimed reward for a quest
     */
    function hasClaimedReward(bytes32 questId, address user) 
        external 
        view 
        returns (bool) 
    {
        return questClaimed[questId][user];
    }
    
    /**
     * @dev Deposit mUSD tokens into the contract (owner only)
     */
    function depositTokens(uint256 amount) external onlyOwner {
        require(
            musdToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        emit TokensDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Emergency withdraw tokens (owner only)
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(
            musdToken.transfer(msg.sender, amount),
            "Transfer failed"
        );
        emit TokensWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Get contract's mUSD balance
     */
    function getContractBalance() external view returns (uint256) {
        return musdToken.balanceOf(address(this));
    }
    
    /**
     * @dev Verify backend signature
     * Backend signs: keccak256(questId, userAddress, amount)
     */
    function _verifySignature(
        bytes32 questId,
        address user,
        uint256 amount,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(questId, user, amount));
        bytes32 ethSignedMessage = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        
        address signer = _recoverSigner(ethSignedMessage, signature);
        return signer == owner();
    }
    
    /**
     * @dev Recover signer from signature
     */
    function _recoverSigner(bytes32 hash, bytes memory signature)
        private
        pure
        returns (address)
    {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature version");
        
        return ecrecover(hash, v, r, s);
    }
}

