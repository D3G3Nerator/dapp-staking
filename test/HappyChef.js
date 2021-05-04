const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const Happy = artifacts.require("./Happy.sol");
const HappyChef = artifacts.require("./HappyChef.sol");
const TokenStub = artifacts.require("./TokenStub.sol");
const ChainLinkStub = artifacts.require("./ChainLinkStub.sol");

contract("HappyChef", accounts => {
  
  const admin = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];


  beforeEach(async () => {
    this.Happy = await Happy.new();
    this.HappyChef = await HappyChef.new(this.Happy.address);

    await this.Happy.transferOwnership(this.HappyChef.address, { from: admin });

    this.Dai = await TokenStub.new("DAI Token", "DAI");
    this.Usdc = await TokenStub.new("USDC Token", "USDC");

    this.ChainLink = await ChainLinkStub.new();

    this.HappyChef.addPool(this.Dai.address, this.ChainLink.address);
    this.HappyChef.addPool(this.Usdc.address, this.ChainLink.address);
  });


  it("...should have 2 initialized pools.", async () => {
    const pool0 = await this.HappyChef.pools.call(0);

    expect(pool0.token).to.be.equal(this.Dai.address);
    expect(pool0.amount).to.be.bignumber.equal(new BN(0));
    expect(pool0.priceFeed).to.be.equal(this.ChainLink.address);

    const pool1 = await this.HappyChef.pools.call(1);

    expect(pool1.token).to.be.equal(this.Usdc.address);
    expect(pool1.amount).to.be.bignumber.equal(new BN(0));
    expect(pool1.priceFeed).to.be.equal(this.ChainLink.address);
  });
});
