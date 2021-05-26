
var Happy = artifacts.require("./Happy.sol");
var HappyChef = artifacts.require("./HappyChef.sol");

var TokenStub = artifacts.require("./TokenStub.sol");
var HappyChainLinkStub = artifacts.require("./HappyChainLinkStub.sol");
var ChainLinkStub = artifacts.require("./ChainLinkStub.sol");

module.exports = async (deployer, network, accounts) => {
  // Happy token
  await deployer.deploy(Happy);
  const HappyInstance = await Happy.deployed();

  // Happy chainlink stub
  // Happy price is based on block number
  let k = 1000;
  if (network === 'kovan') {
    k = 10000000;
  }
  await deployer.deploy(HappyChainLinkStub, 1000);
  //const HappyChainLinkStubInstance = await HappyChainLinkStub.deployed();

  // HappyChef
  await deployer.deploy(HappyChef, Happy.address, HappyChainLinkStub.address);
  const HappyChefInstance = await HappyChef.deployed();

  await HappyInstance.transferOwnership(HappyChef.address);

  console.log('---=== Deploying stubs ===---');
  const DaiStub = await deployer.deploy(TokenStub, 'DAI Token', 'DAI');
  const UsdcStub = await deployer.deploy(TokenStub, 'USDC Token', 'USDC');
  const UsdtStub = await deployer.deploy(TokenStub, 'USDT Token', 'USDT');

  if (network === 'develop') {
    // Chainlink stub for stablecoins
    await deployer.deploy(ChainLinkStub, 1);
    
    await HappyChefInstance.addPool(DaiStub.address, ChainLinkStub.address, 1500);
    await HappyChefInstance.addPool(UsdcStub.address, ChainLinkStub.address, 1250);
    await HappyChefInstance.addPool(UsdtStub.address, ChainLinkStub.address, 1200);
  }
  else if (network == 'kovan') {
    await HappyChefInstance.addPool(DaiStub.address, '0x777A68032a88E5A84678A77Af2CD65A7b3c0775a', 1500);
    await HappyChefInstance.addPool(UsdcStub.address, '0x9211c6b3BF41A10F78539810Cf5c64e1BB78Ec60', 1250);
    await HappyChefInstance.addPool(UsdtStub.address, '0x2ca5A90D34cA333661083F89D831f757A9A50148', 1200);
  }

}
