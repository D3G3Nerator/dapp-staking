
var Happy = artifacts.require("./Happy.sol");
var HappyChef = artifacts.require("./HappyChef.sol");

var TokenStub = artifacts.require("./TokenStub.sol");
var ChainLinkStub = artifacts.require("./ChainLinkStub.sol");

module.exports = (deployer, network, accounts) => {
  deployer.deploy(Happy).then(() => {
    return deployer.deploy(HappyChef, Happy.address, '10000000000000000000').then(async () => {
      if (network === 'develop') {
        console.log('---=== Deploying stubs ===---');
    
        const cls = deployer.deploy(ChainLinkStub, 1);

        const happy = await Happy.deployed();
        const happyChef = await HappyChef.deployed();

        deployer.deploy(TokenStub, 'DAI Token', 'DAI').then(async () => {
          await happyChef.addPool(TokenStub.address, ChainLinkStub.address, 1000);
        });
        deployer.deploy(TokenStub, 'USDC Token', 'USDC').then(async () => {
          await happyChef.addPool(TokenStub.address, ChainLinkStub.address, 1000);
        });
        deployer.deploy(TokenStub, 'USDT Token', 'USDT').then(async () => {
          await happyChef.addPool(TokenStub.address, ChainLinkStub.address, 1000);
        });

        await happy.transferOwnership(happyChef.address);
        
        return cls;
      }
    })
  });

};
