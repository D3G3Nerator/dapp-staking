// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';


// @dev For tests only
contract HappyChainLinkStub is AggregatorV3Interface, Ownable {
    
    uint256 k;

    constructor(uint256 _k) {
        k = _k;
    }

    function decimals() override external view returns (uint8) {
        return 18;
    }

    function description() override external view returns (string memory) {
        return "HappyChainLinkStub";
    }

    function version() override external view returns (uint256) {
        return 1;
    }

  
    function getRoundData(uint80 _roundId) override external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        //return (_roundId, int256(block.number * 10 ** 18 / k), 1, 1, 1);
        return (_roundId, 10 * 10**18, 1, 1, 1);
    }

    function latestRoundData() override external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        //return (0, int256(block.number * 10 ** 18 / k), 1, 1, 1);
        return (0, 10 * 10**18, 1, 1, 1);
    }
}