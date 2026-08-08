// HPW On-Chain Event Indexer
// 监听链上 Reward 事件，把链上积分同步到本地 db
// 启动: node contracts/indexer.cjs
//
// 可选 env:
//   RPC_URL=https://sepolia.base.org
//   HPW_ADDRESS=0x...
//   START_BLOCK=12345
//   POLL_INTERVAL_MS=15000

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const HPW_ADDRESS = process.env.HPW_ADDRESS || '0x0000000000000000000000000000000000000000';
const START_BLOCK = parseInt(process.env.START_BLOCK || '0');
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '15000');

// 链上事件 ABI（只取需要的）
const HPW_ABI = [
  'event Reward(address indexed to, uint256 amount, string reason)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function totalSupply() view returns (uint256)',
  'function cap() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

// 本地 db 路径
const DB_DIR = path.resolve(__dirname, '..', 'data', 'chain');
const DB_FILE = path.join(DB_DIR, 'indexed.json');

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      lastBlock: START_BLOCK,
      rewards: [],      // {txHash, blockNumber, to, amount, reason, timestamp, logIndex}
      transfers: [],    // {txHash, blockNumber, from, to, value, timestamp, logIndex}
      balances: {}      // address -> { balance, updatedAt }
    }, null, 2));
  }
}

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

async function main() {
  ensureDb();
  const db = readDb();

  console.log('=== HPW Indexer ===');
  console.log('RPC:', RPC_URL);
  console.log('HPW:', HPW_ADDRESS);
  console.log('Start block:', db.lastBlock);

  if (HPW_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.warn('\n⚠️  HPW_ADDRESS is unset. Set HPW_ADDRESS env var to your deployed contract address.');
    console.warn('   Get address from: contracts/deployments/<network>.json');
    console.log('   Exiting gracefully (idle mode).');
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(HPW_ADDRESS, HPW_ABI, provider);

  // 测试连接
  const network = await provider.getNetwork();
  console.log('Connected to chainId:', network.chainId);

  let totalSupply;
  try {
    totalSupply = await contract.totalSupply();
    console.log('Total supply:', ethers.formatEther(totalSupply), 'HPW');
  } catch (e) {
    console.error('Failed to call totalSupply:', e.message);
    return;
  }

  // 同步循环
  async function sync() {
    try {
      const currentBlock = await provider.getBlockNumber();
      if (currentBlock <= db.lastBlock) {
        console.log(`[${new Date().toISOString()}] No new blocks (current=${currentBlock})`);
        return;
      }

      const fromBlock = db.lastBlock + 1;
      const toBlock = Math.min(currentBlock, fromBlock + 9999); // 限制每次查询范围

      console.log(`[${new Date().toISOString()}] Syncing blocks ${fromBlock}-${toBlock} (${toBlock - fromBlock + 1} blocks)`);

      // 拉取 Reward 事件
      const rewardEvents = await contract.queryFilter('Reward', fromBlock, toBlock);
      for (const ev of rewardEvents) {
        const { to, amount, reason } = ev.args;
        const block = await ev.getBlock();
        db.rewards.push({
          txHash: ev.transactionHash,
          blockNumber: ev.blockNumber,
          logIndex: ev.index,
          to,
          amount: amount.toString(),
          reason,
          timestamp: block.timestamp,
        });
        console.log(`  Reward: ${to} ← ${ethers.formatEther(amount)} HPW (${reason})`);
      }

      // 拉取 Transfer 事件（追踪用户之间的转账）
      const transferEvents = await contract.queryFilter('Transfer', fromBlock, toBlock);
      for (const ev of transferEvents) {
        const { from, to, value } = ev.args;
        const block = await ev.getBlock();
        db.transfers.push({
          txHash: ev.transactionHash,
          blockNumber: ev.blockNumber,
          logIndex: ev.index,
          from,
          to,
          value: value.toString(),
          timestamp: block.timestamp,
        });
      }

      db.lastBlock = toBlock;
      writeDb(db);
      console.log(`  Indexed ${rewardEvents.length} Reward + ${transferEvents.length} Transfer events`);
    } catch (e) {
      console.error('Sync error:', e.message);
    }
  }

  // 立即同步一次，然后定期
  await sync();
  setInterval(sync, POLL_INTERVAL_MS);
  console.log(`\nPolling every ${POLL_INTERVAL_MS}ms. Ctrl+C to stop.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
