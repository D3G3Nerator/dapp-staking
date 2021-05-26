// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';


// @dev For tests only
contract ChainLinkStub is AggregatorV3Interface, Ownable {

    int256 value;

    constructor(int256 _value) {
        value = _value;
    }

    function decimals() override external view returns (uint8) {
        return 8;
    }

    function description() override external view returns (string memory) {
        return "ChainLinkStub";
    }

    function version() override external view returns (uint256) {
        return 1;
    }

  
    function getRoundData(uint80 _roundId) override external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        return (_roundId, value * 10 ** 8, 1, 1, 1);
    }

    function latestRoundData() override external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        return (0, value * 10 ** 8, 1, 1, 1);
    }
}