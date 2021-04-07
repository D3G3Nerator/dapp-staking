// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/access/Ownable.sol';
import './Happy.sol';


contract HappyChef is Ownable {

    // The reward token
    Happy public happy;


    constructor(Happy _happy) {
        happy = _happy;
    }

}