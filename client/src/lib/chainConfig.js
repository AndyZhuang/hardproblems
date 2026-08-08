// HPW Chain Configuration
// HPW token is deployed on Base Sepolia (testnet) initially, then Base mainnet.
// To deploy: see contracts/scripts/deploy.cjs
// To get testnet ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

import HPW_ABI from './hpwAbi.js';

// Chain configurations
export const CHAINS = {
  // Base Sepolia (testnet, default for development)
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    faucet: 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
    isTestnet: true,
  },
  // Base mainnet
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    isTestnet: false,
  },
};

export const DEFAULT_CHAIN = CHAINS.baseSepolia;

// HPW contract addresses (update after deployment)
export const HPW_ADDRESSES = {
  baseSepolia: import.meta.env.VITE_HPW_ADDRESS_BASE_SEPOLIA || '0x0000000000000000000000000000000000000000',
  base: import.meta.env.VITE_HPW_ADDRESS_BASE || '0x0000000000000000000000000000000000000000',
};

export const HPW_ABI_EXPORT = HPW_ABI;

// Check if HPW is deployed on current chain
export function isHPWDeployed(chainId) {
  if (chainId === CHAINS.baseSepolia.id) return HPW_ADDRESSES.baseSepolia !== '0x0000000000000000000000000000000000000000';
  if (chainId === CHAINS.base.id) return HPW_ADDRESSES.base !== '0x0000000000000000000000000000000000000000';
  return false;
}

export function getHPWAddress(chainId) {
  if (chainId === CHAINS.baseSepolia.id) return HPW_ADDRESSES.baseSepolia;
  if (chainId === CHAINS.base.id) return HPW_ADDRESSES.base;
  return null;
}
