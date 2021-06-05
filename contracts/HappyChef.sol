// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

import './Happy.sol';


contract HappyChef is Ownable, ReentrancyGuard {

    struct UserInfo {
        uint256 amount;         // Amount of staked token provided
        uint256 depositDate;    // Deposit date for interest calculation
    }

    struct PoolInfo {
        ERC20 token;               // Address of the staked token
        uint256 yield;              // Percentage yield for the pool, with 2 decimals
        AggregatorV3Interface priceFeed;    // ChainLink oracle for the staked token
    }

    // The reward token
    Happy public happy;

    // The staking pools
    PoolInfo[] public pools;

    // For each pool, user info
    mapping (uint256 => mapping(address => UserInfo)) public users;

    // Price feed for the reward token
    AggregatorV3Interface public happyPriceFeed;

    event PoolAdded(uint256 poolId, address token, address priceFeed);
    event PriceFeedUpdated(uint256 poolId, ERC20 token, address priceFeed);
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


    constructor(Happy _happy, address _happyPriceFeed) {
        happy = _happy;
        happyPriceFeed = AggregatorV3Interface(_happyPriceFeed);
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


    function addPool(address _token, address _priceFeed, uint256 _yield) external onlyOwner {
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
            token: ERC20(_token),
            yield: _yield,
            priceFeed: AggregatorV3Interface(_priceFeed)
        }));

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

        if (user.amount > 0) {
            // User had already staked, distribute reward
            _distributeReward(_poolId, pool, user);
        }
    
        user.amount += _amount;
        user.depositDate = block.timestamp;

        pool.token.transferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _poolId, _amount);
    }


    function _calculateReward(uint256 _poolId, PoolInfo storage _pool, UserInfo storage _user) internal view returns (uint256) {
        uint256 pending = _user.amount 
            * (block.timestamp - _user.depositDate) / 60 / 60 / 24   // Datetime pro rata
            * _pool.yield / 100 / 100 / 365                          // Pool yield (First / 100 is for 2 decimals, second is for %)
            * getLastPrice(_poolId) / getLastHappyPrice();           // Adjustment to price

        return pending;
    }


    function calculateRewardDebug(uint256 _poolId, address _user) external view returns (uint256 userAmount, uint256 delta, uint256 yield, uint256 lastPrice, uint256 lastHappyPrice) {
        PoolInfo storage pool = pools[_poolId];
        UserInfo storage user = users[_poolId][_user];

        userAmount = user.amount;
        delta = block.timestamp - user.depositDate;
        yield = pool.yield;
        lastPrice = getLastPrice(_poolId);
        lastHappyPrice = getLastHappyPrice();
    }


    function _distributeReward(uint256 _poolId, PoolInfo storage _pool, UserInfo storage _user) internal {
        uint256 pending = _calculateReward(_poolId, _pool, _user);
        if (pending > 0) {
            happy.mint(address(this), pending);
            happy.transfer(msg.sender, pending);

            _user.depositDate = block.timestamp;

            emit Redeemed(msg.sender, _poolId, pending);
        }
    }


    // If this function is called with 0 as amount, it withdraw only the reward
    function unstake(uint256 _poolId, uint256 _amount) external validPool(_poolId) nonReentrant {
        PoolInfo storage pool = pools[_poolId];
        UserInfo storage user = users[_poolId][msg.sender];
        require(_amount <= user.amount, "Insufficient staked amount");

        _distributeReward(_poolId, pool, user);

        if (_amount > 0) {
            user.amount -= _amount;
            pool.token.transfer(msg.sender, _amount);
        }

        emit Unstaked(msg.sender, _poolId, _amount);
    }


    function pendingReward(uint256 _poolId, address _user) external view validPool(_poolId) returns (uint256) {
        PoolInfo storage pool = pools[_poolId];
        UserInfo storage user = users[_poolId][_user];

        return _calculateReward(_poolId, pool, user);
    }


    function getLastPrice(uint256 _poolId) public view validPool(_poolId) returns (uint256) {        
        PoolInfo storage pool = pools[_poolId];

        (
            /*uint80 roundId*/,
            int price,
            /*uint startAt*/,
            /*uint timestamp*/,
            /*uint80 answeredInRound*/
        ) = pool.priceFeed.latestRoundData();

        uint256 lastPrice = uint256(price);
        if (pool.token.decimals() != 18) {
            lastPrice *= 10 ** (18 - pool.token.decimals());
        }

        return lastPrice;
    }


    function getLastHappyPrice() public view returns (uint256) {
        (
            /*uint80 roundId*/,
            int price,
            /*uint startAt*/,
            /*uint timestamp*/,
            /*uint80 answeredInRound*/
        ) = happyPriceFeed.latestRoundData();

        return uint256(price);
    }

}
