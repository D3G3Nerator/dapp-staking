// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// @dev For tests only
contract TokenStub is ERC20 {
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Le million, le million !
        _mint(0x6A25851E4D9ef607fd6508DDbcA97f1bE293A225, 1000000 ether);
        _mint(0x8353912dBF8Ee3dC19c2B8E34c80E26f83d65833, 1000000 ether);
        _mint(0x4166F24706226d3c2A134a0966A8d534FCea31Cc, 1000000 ether);
    }

}
