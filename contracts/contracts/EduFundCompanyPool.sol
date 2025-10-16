// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EduFundCompanyPool
 * @dev Manages company-funded learning pools with secure MUSD distribution
 * Based on OpenZeppelin escrow patterns for safe token management
 */
contract EduFundCompanyPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public musdToken;
    
    struct Pool {
        address company;
        string courseName;
        uint256 totalFund;
        uint256 rewardPerStudent;
        uint256 maxParticipants;
        uint256 remainingBalance;
        uint256 studentsRewarded;
        bool active;
    }
    
    // Pool ID => Pool details
    mapping(bytes32 => Pool) public pools;
    
    // Pool ID => Student Address => Claimed status
    mapping(bytes32 => mapping(address => bool)) public poolClaims;
    
    // Events
    event PoolCreated(
        bytes32 indexed poolId,
        address indexed company,
        string courseName,
        uint256 totalFund,
        uint256 rewardPerStudent,
        uint256 maxParticipants
    );
    
    event RewardDistributed(
        bytes32 indexed poolId,
        address indexed student,
        uint256 amount,
        uint256 remainingBalance
    );
    
    event PoolClosed(bytes32 indexed poolId, uint256 refundedAmount);
    event PoolRefilled(bytes32 indexed poolId, uint256 amount);
    
    constructor(address _musdToken) Ownable(msg.sender) {
        require(_musdToken != address(0), "Invalid MUSD token address");
        musdToken = IERC20(_musdToken);
    }
    
    /**
     * @dev Create a new funding pool
     * Company must approve this contract to spend MUSD before calling
     */
    function createPool(
        bytes32 poolId,
        string memory courseName,
        uint256 totalFund,
        uint256 rewardPerStudent,
        uint256 maxParticipants
    ) external nonReentrant {
        require(pools[poolId].company == address(0), "Pool ID already exists");
        require(totalFund > 0, "Total fund must be greater than 0");
        require(rewardPerStudent > 0, "Reward per student must be greater than 0");
        require(maxParticipants > 0, "Max participants must be greater than 0");
        require(
            totalFund >= rewardPerStudent * maxParticipants,
            "Total fund insufficient for max participants"
        );
        
        // Transfer MUSD from company to contract
        musdToken.safeTransferFrom(msg.sender, address(this), totalFund);
        
        // Create pool
        pools[poolId] = Pool({
            company: msg.sender,
            courseName: courseName,
            totalFund: totalFund,
            rewardPerStudent: rewardPerStudent,
            maxParticipants: maxParticipants,
            remainingBalance: totalFund,
            studentsRewarded: 0,
            active: true
        });
        
        emit PoolCreated(
            poolId,
            msg.sender,
            courseName,
            totalFund,
            rewardPerStudent,
            maxParticipants
        );
    }
    
    /**
     * @dev Distribute reward to student from a specific pool
     * Can only be called by contract owner (backend)
     */
    function distributeReward(
        bytes32 poolId,
        address student,
        bytes32 questId,
        bytes memory signature
    ) external onlyOwner nonReentrant {
        Pool storage pool = pools[poolId];
        
        require(pool.active, "Pool is not active");
        require(pool.company != address(0), "Pool does not exist");
        require(!poolClaims[poolId][student], "Student already claimed from this pool");
        require(pool.remainingBalance >= pool.rewardPerStudent, "Insufficient pool balance");
        require(pool.studentsRewarded < pool.maxParticipants, "Max participants reached");
        
        // Verify backend signature
        require(
            _verifyDistributionSignature(poolId, student, questId, signature),
            "Invalid signature"
        );
        
        // Mark as claimed
        poolClaims[poolId][student] = true;
        
        // Update pool stats
        pool.remainingBalance -= pool.rewardPerStudent;
        pool.studentsRewarded += 1;
        
        // Transfer MUSD to student
        musdToken.safeTransfer(student, pool.rewardPerStudent);
        
        emit RewardDistributed(poolId, student, pool.rewardPerStudent, pool.remainingBalance);
    }
    
    /**
     * @dev Refill a pool with additional MUSD
     */
    function refillPool(bytes32 poolId, uint256 amount) external nonReentrant {
        Pool storage pool = pools[poolId];
        
        require(pool.company == msg.sender, "Only pool creator can refill");
        require(pool.active, "Pool is not active");
        require(amount > 0, "Amount must be greater than 0");
        
        musdToken.safeTransferFrom(msg.sender, address(this), amount);
        
        pool.totalFund += amount;
        pool.remainingBalance += amount;
        
        emit PoolRefilled(poolId, amount);
    }
    
    /**
     * @dev Close pool and refund remaining balance to company
     */
    function closePool(bytes32 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];
        
        require(pool.company == msg.sender, "Only pool creator can close");
        require(pool.active, "Pool already closed");
        
        pool.active = false;
        uint256 refundAmount = pool.remainingBalance;
        pool.remainingBalance = 0;
        
        if (refundAmount > 0) {
            musdToken.safeTransfer(msg.sender, refundAmount);
        }
        
        emit PoolClosed(poolId, refundAmount);
    }
    
    /**
     * @dev Get pool details
     */
    function getPool(bytes32 poolId) external view returns (Pool memory) {
        return pools[poolId];
    }
    
    /**
     * @dev Check if student has claimed from pool
     */
    function hasClaimed(bytes32 poolId, address student) external view returns (bool) {
        return poolClaims[poolId][student];
    }
    
    /**
     * @dev Verify backend signature for distribution
     * Backend signs: keccak256(poolId, studentAddress, questId)
     */
    function _verifyDistributionSignature(
        bytes32 poolId,
        address student,
        bytes32 questId,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(poolId, student, questId));
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
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        musdToken.safeTransfer(owner(), amount);
    }
}

