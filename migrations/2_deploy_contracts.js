var HappyCoin = artifacts.require("./Happy.sol");
var HappyChef = artifacts.require("./HappyChef.sol");

module.exports = function(deployer) {
  deployer.deploy(HappyCoin).then(() => {
    return deployer.deploy(HappyChef, HappyCoin.address);
  });
};
