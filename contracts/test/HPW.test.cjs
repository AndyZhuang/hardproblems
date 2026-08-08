// Hardhat test for HPW contract
// Run: npx hardhat test contracts/test/HPW.test.cjs

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HPW', function () {
  let HPW, hpw, owner, minter, alice, bob;

  beforeEach(async function () {
    [owner, minter, alice, bob] = await ethers.getSigners();
    const HPWFactory = await ethers.getContractFactory('HPW');
    hpw = await HPWFactory.deploy(minter.address);
    await hpw.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should set the right owner and minter', async function () {
      expect(await hpw.owner()).to.equal(owner.address);
      expect(await hpw.rewardMinter()).to.equal(minter.address);
    });

    it('should have correct name and symbol', async function () {
      expect(await hpw.name()).to.equal('HardProblems.World');
      expect(await hpw.symbol()).to.equal('HPW');
    });

    it('should start with 0 supply', async function () {
      expect(await hpw.totalSupply()).to.equal(0);
    });

    it('should expose cap of 1B tokens', async function () {
      const cap = await hpw.CAP();
      expect(cap).to.equal(ethers.parseEther('1000000000'));
    });
  });

  describe('reward()', function () {
    it('should mint tokens to recipient by minter', async function () {
      const amount = ethers.parseEther('100');
      await hpw.connect(minter).reward(alice.address, amount, 'test');
      expect(await hpw.balanceOf(alice.address)).to.equal(amount);
      expect(await hpw.totalSupply()).to.equal(amount);
    });

    it('should mint tokens to recipient by owner', async function () {
      const amount = ethers.parseEther('50');
      await hpw.connect(owner).reward(bob.address, amount, 'test');
      expect(await hpw.balanceOf(bob.address)).to.equal(amount);
    });

    it('should reject reward from non-minter/non-owner', async function () {
      const amount = ethers.parseEther('10');
      await expect(
        hpw.connect(alice).reward(bob.address, amount, 'hack')
      ).to.be.revertedWith('HPW: not rewardMinter');
    });

    it('should reject zero amount', async function () {
      await expect(
        hpw.connect(minter).reward(alice.address, 0, 'zero')
      ).to.be.revertedWith('HPW: zero amount');
    });

    it('should reject zero address', async function () {
      await expect(
        hpw.connect(minter).reward(ethers.ZeroAddress, 100, 'zero')
      ).to.be.revertedWith('HPW: zero to');
    });

    it('should emit Reward event', async function () {
      const amount = ethers.parseEther('42');
      await expect(hpw.connect(minter).reward(alice.address, amount, 'event-test'))
        .to.emit(hpw, 'Reward')
        .withArgs(alice.address, amount, 'event-test');
    });
  });

  describe('Cap enforcement', function () {
    it('should reject minting that would exceed cap', async function () {
      const cap = await hpw.CAP();
      const overCap = cap + 1n;
      await expect(
        hpw.connect(minter).reward(alice.address, overCap, 'over')
      ).to.be.revertedWith('HPW: cap exceeded');
    });
  });

  describe('rewardBatch()', function () {
    it('should reward multiple recipients', async function () {
      const recipients = [alice.address, bob.address];
      const amounts = [
        ethers.parseEther('100'),
        ethers.parseEther('200')
      ];
      await hpw.connect(minter).rewardBatch(recipients, amounts, 'batch');
      expect(await hpw.balanceOf(alice.address)).to.equal(amounts[0]);
      expect(await hpw.balanceOf(bob.address)).to.equal(amounts[1]);
    });

    it('should reject mismatched array lengths', async function () {
      await expect(
        hpw.connect(minter).rewardBatch(
          [alice.address],
          [ethers.parseEther('1'), ethers.parseEther('2')],
          'mismatch'
        )
      ).to.be.revertedWith('HPW: length mismatch');
    });
  });

  describe('setRewardMinter()', function () {
    it('should let owner update minter', async function () {
      await hpw.connect(owner).setRewardMinter(alice.address);
      expect(await hpw.rewardMinter()).to.equal(alice.address);
    });

    it('should reject non-owner', async function () {
      await expect(
        hpw.connect(alice).setRewardMinter(bob.address)
      ).to.be.reverted;
    });
  });

  describe('Standard ERC20', function () {
    it('should support transfer', async function () {
      const amount = ethers.parseEther('100');
      await hpw.connect(minter).reward(alice.address, amount, 't');
      await hpw.connect(alice).transfer(bob.address, amount);
      expect(await hpw.balanceOf(bob.address)).to.equal(amount);
      expect(await hpw.balanceOf(alice.address)).to.equal(0);
    });

    it('should support approve and transferFrom', async function () {
      const amount = ethers.parseEther('50');
      await hpw.connect(minter).reward(alice.address, amount, 't');
      await hpw.connect(alice).approve(bob.address, amount);
      await hpw.connect(bob).transferFrom(alice.address, bob.address, amount);
      expect(await hpw.balanceOf(bob.address)).to.equal(amount);
    });
  });
});
