// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Happy is ERC20 {

  constructor() ERC20('Happy coin', 'HAPPY') {    
  }

}
