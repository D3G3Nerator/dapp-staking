// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';


// @dev For tests only
contract ChainLinkStub is AggregatorV3Interface, Ownable {

    uint8 _decimals = 18;
    uint256 _version = 1;
    string _description = "ChainLinkStub";
    int256 _value;

    constructor(int256 value) {
        _value = value;
    }

    function decimals() override external view returns (uint8) {
        return _decimals;
    }

    function description() override external view returns (string memory) {
        return _description;
    }

    function version() override external view returns (uint256) {
        return _version;
    }

  
    function getRoundData(uint80 _roundId) override external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        return (_roundId, _value, 1, 1, 1);
    }

    function latestRoundData() override external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        return (0, _value, 1, 1, 1);
    }
}