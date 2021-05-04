// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';


// Happy token. 
// @notice Ownership must be transfered to HappyChef, for reward minting.
contract Happy is ERC20, Ownable {

  constructor() ERC20('Happy coin', 'HAPPY') {    
  }


  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }

}
