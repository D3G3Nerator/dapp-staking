// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// @dev For tests only
contract TokenStub is ERC20 {
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 10000000 ether);
    }

     function decimals() public view override returns (uint8) {
        return 8;
    }

}
