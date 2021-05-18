// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

import './Happy.sol';


contract HappyChef is Ownable, ReentrancyGuard {

    struct UserInfo {
        uint256 amount;     // Amount of staked token provided
        uint256 rewardDebt; // Amount of reward already withdrawn
    }

    struct PoolInfo {
        IERC20 token;               // Address of the staked token
        uint256 allocation;         // Pool allocation points, see totalAllocation for details
        uint256 accRewardPerShare;  // Accumulated reward per 1 token
        uint256 lastRewardBlock;    // Last reward for minting
        AggregatorV3Interface priceFeed;    // ChainLink oracle for the staked token
    }

    // The reward token
    Happy public happy;

    // Reward token minted for each block
    uint256 rewardPerBlock;

    // Sum of allocation for all the pools, for dispatching the reward token
    // For example if we have the following pools:
    //   Pools              |   1  |   2  |   3
    //   Allocation points  | 1000 | 1000 | 2000   totalAllocation = 4000
    // and a rewardPerBlock of 10, the reward per block for each pool will be:
    //   Pools              |   1  |   2  |   3
    //   Token reward/block | 2.50 | 2.50 | 5.00
    uint256 totalAllocation;

    // The staking pools
    PoolInfo[] public pools;

    // For each pool, user info
    mapping (uint256 => mapping(address => UserInfo)) public users;


    event PoolAdded(uint256 poolId, address token, address priceFeed);
    event PriceFeedUpdated(uint256 poolId, IERC20 token, address priceFeed);
    event Staked(address user, uint256 poolId, uint256 amount);
    event Unstaked(address user, uint256 poolId, uint256 amount);
    event Redeemed(address user, uint256 poolId, uint256 amount);


    // Check that the pool id is in the array range.
    modifier validPool(uint256 _poolId) {
        require(_poolId < pools.length, "Invalid poolId");
        _;
    }


    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be >0");
        _;
    }


    constructor(Happy _happy, uint256 _rewardPerBlock) {
        happy = _happy;
        rewardPerBlock = _rewardPerBlock;
    }


    function getNbPools() external view returns (uint256) {
        return pools.length;
    }


    function getUserBalance(uint256 poolId, address user) external view returns (uint256) {
        return users[poolId][user].amount;
    }


    function getPoolBalance(uint256 poolId) external view returns (uint256) {
        return pools[poolId].token.balanceOf(address(this));
    }


    function addPool(address _token, address _priceFeed, uint256 _allocation) external onlyOwner {
        // Check if pool already added
        bool found = false;
        for (uint i = 0; i < pools.length; i++) {
            if (pools[i].token == IERC20(_token)) {
                found = true;
                break;
            }
        }
        require(!found, "Pool with this token already exists.");

        pools.push(PoolInfo({
            token: IERC20(_token),
            allocation: _allocation,
            accRewardPerShare: 0,
            lastRewardBlock: block.number,
            priceFeed: AggregatorV3Interface(_priceFeed)
        }));

        totalAllocation += _allocation;

        emit PoolAdded(pools.length - 1, _token, _priceFeed);
    }


    function updatePriceFeed(uint256 _poolId, address priceFeed) external validPool(_poolId) onlyOwner {
        pools[_poolId].priceFeed = AggregatorV3Interface(priceFeed);

        emit PriceFeedUpdated(_poolId, pools[_poolId].token, priceFeed);
    }

    
    // Token approval is needed before calling this function.
    function stake(uint256 _poolId, uint256 _amount) external validPool(_poolId) validAmount(_amount) nonReentrant {
        PoolInfo storage pool = pools[_poolId];
        UserInfo storage user = users[_poolId][msg.sender];
        require(pool.token.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        updatePool(_poolId);

        if (user.amount > 0) {
            // User had already staked, distribute reward
            _distributeReward(_poolId, pool, user);
        }
    
        user.amount += _amount;
        user.rewardDebt = _calculateReward(pool, user);

        pool.token.transferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _poolId, _amount);
    }


    function _calculateReward(PoolInfo storage pool, UserInfo storage user) internal view returns (uint256) {
        return user.amount * pool.accRewardPerShare / 1e18;
    }


    function _distributeReward(uint256 poolId, PoolInfo storage pool, UserInfo storage user) internal {
        uint256 pending = _calculateReward(pool, user) - user.rewardDebt;
        if (pending > 0) {
            happy.transfer(msg.sender, pending);

            emit Redeemed(msg.sender, poolId, pending);
        }
    }


    function updatePool(uint256 _poolId) public validPool(_poolId) {
        PoolInfo storage pool = pools[_poolId];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }

        uint256 supply = pool.token.balanceOf(address(this));
        if (supply != 0) {
            uint256 reward = (block.number - pool.lastRewardBlock) * rewardPerBlock * pool.allocation / totalAllocation;
            happy.mint(address(this), reward);
            pool.accRewardPerShare += reward * 1e18 / supply;
        }

        pool.lastRewardBlock = block.number;
    }


    // If this function is called with 0 as amount, it withdraw only the reward
    function unstake(uint256 _poolId, uint256 _amount) external validPool(_poolId) nonReentrant {
        PoolInfo storage pool = pools[_poolId];
        UserInfo storage user = users[_poolId][msg.sender];
        require(_amount <= user.amount, "Insufficient staked amount");

        updatePool(_poolId);

        _distributeReward(_poolId, pool, user);

        if (_amount > 0) {
            user.amount -= _amount;
            pool.token.transfer(msg.sender, _amount);
        }

        // Recalculate rewardDebt (if user partially unstake, will be zero if unstake all)
        user.rewardDebt = _calculateReward(pool, user);

        emit Unstaked(msg.sender, _poolId, _amount);
    }


    function pendingReward(uint256 _poolId, address _user) external view validPool(_poolId) returns (uint256) {
        PoolInfo storage pool = pools[_poolId];
        UserInfo storage user = users[_poolId][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 supply = pool.token.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && supply != 0) {
            uint256 reward = (block.number - pool.lastRewardBlock) * rewardPerBlock * pool.allocation / totalAllocation;
            accRewardPerShare += reward * 1e18 / supply;
        }

        return user.amount * accRewardPerShare / 1e18 - user.rewardDebt;
    }


    function getLastPrice(uint256 _poolId) public view validPool(_poolId) returns (int) {        
        (
            /*uint80 roundId*/,
            int price,
            /*uint startAt*/,
            /*uint timestamp*/,
            /*uint80 answeredInRound*/
        ) = pools[_poolId].priceFeed.latestRoundData();

        return price;
    }

}
