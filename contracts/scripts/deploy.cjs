// Deploy HPW to Base Sepolia
// Usage: npx hardhat run contracts/scripts/deploy.cjs --network baseSepolia
//
// After deployment:
//   - Copy HPW_ADDRESS into client/src/lib/chainConfig.js
//   - Set REWARD_MINTER_ADDRESS = the server hot wallet that will call reward()

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const rewardMinter = process.env.REWARD_MINTER_ADDRESS || deployer.address;

  console.log('=== HPW Deployment ===');
  console.log('Network:', hre.network.name);
  console.log('Deployer:', deployer.address);
  console.log('Reward Minter:', rewardMinter);
  console.log('Balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'ETH');

  const HPW = await hre.ethers.getContractFactory('HPW');
  const hpw = await HPW.deploy(rewardMinter);
  await hpw.waitForDeployment();

  const address = await hpw.getAddress();
  console.log('\n✅ HPW deployed to:', address);
  console.log('   Name:', await hpw.name());
  console.log('   Symbol:', await hpw.symbol());
  console.log('   Cap:', hre.ethers.formatEther(await hpw.CAP()), 'HPW');
  console.log('   Owner:', await hpw.owner());
  console.log('   Reward Minter:', await hpw.rewardMinter());

  // Save deployment info
  const fs = require('fs');
  const path = require('path');
  const outFile = path.join(__dirname, '..', 'deployments', `${hre.network.name}.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    address,
    deployer: deployer.address,
    rewardMinter,
    deployedAt: new Date().toISOString(),
    txHash: hpw.deploymentTransaction()?.hash,
  }, null, 2));
  console.log('\n📁 Saved to', outFile);

  // Verify on Basescan (if API key present)
  if (process.env.BASESCAN_API_KEY && hre.network.name !== 'hardhat') {
    console.log('\nWaiting 30s before verification...');
    await new Promise(r => setTimeout(r, 30000));
    try {
      await hre.run('verify:verify', {
        address,
        constructorArguments: [rewardMinter],
      });
      console.log('✅ Verified on Basescan');
    } catch (e) {
      console.warn('Verification failed:', e.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
