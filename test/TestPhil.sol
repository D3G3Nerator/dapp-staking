pragma solidity 0.8.3;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Phil.sol";

contract TestPhil {

  function testItStoresAValue() public {
    SimpleStorage simpleStorage = SimpleStorage(DeployedAddresses.SimpleStorage());

    simpleStorage.set(89);

    uint expected = 89;

    Assert.equal(simpleStorage.get(), expected, "It should store the value 89.");
  }

}
