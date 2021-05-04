// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

import './Happy.sol';


contract HappyChef is Ownable {

    struct UserInfo {
        uint256 amount;
    }

    struct PoolInfo {
        IERC20 token;
        uint256 amount;
        AggregatorV3Interface priceFeed;    
    }

    // The reward token
    Happy public happy;

    // The staking pools
    PoolInfo[] public pools;

    // For each pool, user info
    mapping (uint256 => mapping(address => UserInfo)) public users;


    event PoolAdded(uint256 poolId, address token, address priceFeed);
    event PriceFeedUpdated(uint256 poolId, IERC20 token, address priceFeed);
    event Staked(address user, uint256 poolId, uint256 amount);
    event Unstaked(address user, uint256 poolId, uint256 amount);
    event Redeemed(address user, uint256 poolId, uint256 amount);


    constructor(Happy _happy) {
        happy = _happy;
    }


    function addPool(address token, address priceFeed) external onlyOwner {
        // Check if pool already added
        bool found = false;
        for (uint i = 0; i < pools.length; i++) {
            if (pools[i].token == IERC20(token)) {
                found = true;
                break;
            }
        }
        require(!found, "Pool with this token already exists.");

        pools.push(PoolInfo({
            token: IERC20(token),
            amount: 0,
            priceFeed: AggregatorV3Interface(priceFeed)
        }));

        emit PoolAdded(pools.length - 1, token, priceFeed);
    }


    function updatePriceFeed(uint256 _poolId, address priceFeed) external onlyOwner {
        require(_poolId < pools.length, "Invalid poolId");

        pools[_poolId].priceFeed = AggregatorV3Interface(priceFeed);

        emit PriceFeedUpdated(_poolId, pools[_poolId].token, priceFeed);
    }


    function getNbPools() external view returns (uint256) {
        return pools.length;
    }

    
    // Token approval is needed before calling this function.
    function stake(uint256 _poolId, uint256 _amount) external {
        require(_poolId < pools.length, "Invalid poolId");
        require(_amount > 0, "Amount needed");

        PoolInfo storage pool = pools[_poolId];
        UserInfo storage user = users[_poolId][msg.sender];
        require(pool.token.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        if (user.amount > 0) {
            // user had already staked, calculate reward until now
            // TODO
        }
    
        user.amount += _amount;
        pool.amount += _amount;
        bool ret = pool.token.transferFrom(msg.sender, address(this), _amount);
        require(ret, "TransferFrom failed");

        emit Staked(msg.sender, _poolId, _amount);
    }


    // function redeem/harvest ?

    function unstake(uint256 _poolId, uint256 _amount) external {
        require(_poolId < pools.length, "Invalid poolId");
        require(_amount > 0, "Amount needed");

        PoolInfo storage pool = pools[_poolId];
        UserInfo storage user = users[_poolId][msg.sender];
        require(_amount <= user.amount, "Insufficient staked amount");

        // TODO calculate reward

        user.amount -= _amount;
        pool.amount -= _amount;
        bool ret = pool.token.transfer(msg.sender, _amount);
        require(ret, "Transfer failed");

        // TODO Calculate & mint reward
        happy.mint(msg.sender, 10);

        emit Unstaked(msg.sender, _poolId, _amount);
    }


    function getLastPrice(uint256 _poolId) public view returns (int) {
        require(_poolId < pools.length, "Invalid poolId");
        
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
