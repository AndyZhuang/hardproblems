// HPW On-Chain Reward Module
// 调用 Base 上的 HPW 合约，mint 奖励给用户的钱包地址
// 失败时 graceful fallback（仅记录到本地 db，不影响用户使用）

import { ethers } from 'ethers';
import { logger } from './logger.js';

const HPW_ABI = [
  'function reward(address to, uint256 amount, string reason)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function rewardMinter() view returns (address)',
];

// 配置
const RPC_URL = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const HPW_ADDRESS = process.env.HPW_ADDRESS;  // 部署后填入
const REWARD_MINTER_KEY = process.env.REWARD_MINTER_KEY;  // 私钥
const ENABLED = !!(HPW_ADDRESS && REWARD_MINTER_KEY);

let provider = null;
let wallet = null;
let contract = null;

if (ENABLED) {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(REWARD_MINTER_KEY, provider);
    contract = new ethers.Contract(HPW_ADDRESS, HPW_ABI, wallet);
    logger.info('[HPW] On-chain reward module enabled', {
      rpc: RPC_URL,
      token: HPW_ADDRESS,
      minter: wallet.address,
    });
  } catch (e) {
    logger.error('[HPW] Failed to init on-chain module', { err: e.message });
  }
} else {
  logger.info('[HPW] On-chain reward disabled (set HPW_ADDRESS + REWARD_MINTER_KEY to enable)');
}

/**
 * 给用户 mint HPW 代币作为奖励
 * @param {string} walletAddress 用户的链上钱包地址 (0x...)
 * @param {string} amountEth 奖励金额 (HPW 单位，如 "100")
 * @param {string} reason 原因描述（如 "solution:millennium-riemann"）
 * @returns {Promise<{success: boolean, txHash?: string, error?: string, source: 'onchain'|'skipped'}>}
 */
export async function rewardOnChain(walletAddress, amountEth, reason) {
  // 模块未启用：跳过
  if (!ENABLED || !contract) {
    return { success: true, source: 'skipped', reason: 'on-chain module disabled' };
  }
  // 钱包地址无效
  if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    return { success: false, source: 'skipped', error: 'invalid wallet address' };
  }
  try {
    const amountWei = ethers.parseEther(amountEth);
    logger.info('[HPW] sending reward tx', { to: walletAddress, amount: amountEth, reason });
    const tx = await contract.reward(walletAddress, amountWei, reason);
    logger.info('[HPW] reward tx sent', { hash: tx.hash, to: walletAddress, amount: amountEth });
    // 不等待确认（异步）— 用户体验优先
    // tx.wait().then(receipt => logger.info('[HPW] confirmed', { block: receipt.blockNumber }));
    return { success: true, txHash: tx.hash, source: 'onchain' };
  } catch (e) {
    logger.error('[HPW] reward tx failed', { err: e.message, to: walletAddress, amount: amountEth });
    return { success: false, error: e.message, source: 'onchain' };
  }
}

/**
 * 获取合约的当前状态（用于 status 端点）
 */
export async function getHPWStatus() {
  if (!ENABLED || !contract) {
    return {
      enabled: false,
      address: HPW_ADDRESS || null,
      minter: wallet?.address || null,
      rpc: RPC_URL,
    };
  }
  try {
    const [totalSupply, minter] = await Promise.all([
      contract.totalSupply(),
      contract.rewardMinter(),
    ]);
    return {
      enabled: true,
      address: HPW_ADDRESS,
      minter,
      rpc: RPC_URL,
      totalSupply: ethers.formatEther(totalSupply),
    };
  } catch (e) {
    return { enabled: true, address: HPW_ADDRESS, error: e.message };
  }
}

export const HPW_CONFIG = {
  enabled: ENABLED,
  address: HPW_ADDRESS,
  minterAddress: wallet?.address || null,
  chain: 'Base Sepolia (testnet)',
  chainId: 84532,
  explorer: 'https://sepolia.basescan.org',
};
