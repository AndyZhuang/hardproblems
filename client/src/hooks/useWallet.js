// useWallet hook - MetaMask + WalletConnect integration
// Uses Viem for clean EIP-1193 wallet interaction (lighter than wagmi for our needs)

import { useState, useEffect, useCallback } from 'react';
import { createPublicClient, createWalletClient, custom, http, formatEther, parseEther } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { CHAINS, DEFAULT_CHAIN, getHPWAddress, isHPWDeployed, HPW_ABI_EXPORT } from '../lib/chainConfig.js';
import { useAuth } from './useAuth.jsx';

const STORAGE_KEY = 'hpw_wallet';

// Viem public client (read-only, for chain queries)
function getPublicClient(chain) {
  return createPublicClient({
    chain,
    transport: http(chain.rpcUrl),
  });
}

export function useWallet() {
  const { user, updateUser } = useAuth();
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  // 初始化：检查 MetaMask 是否存在 + 恢复上次的连接
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setHasMetaMask(true);
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && window.ethereum) {
      try {
        const { address: savedAddr, chainId: savedChain } = JSON.parse(saved);
        setAddress(savedAddr);
        setChainId(savedChain);
        // 静默重连（不弹窗）
        window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
          if (accounts && accounts[0]?.toLowerCase() === savedAddr?.toLowerCase()) {
            refreshBalance(savedAddr, savedChain);
          } else {
            disconnect();
          }
        }).catch(() => {});
      } catch {}
    }
  }, []);

  // 监听账户/链变化
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0].toLowerCase() !== address?.toLowerCase()) {
        setAddress(accounts[0]);
        saveWallet(accounts[0], chainId);
        refreshBalance(accounts[0], chainId);
      }
    };
    const handleChainChanged = (newChainId) => {
      const cid = parseInt(newChainId, 16);
      setChainId(cid);
      saveWallet(address, cid);
      if (address) refreshBalance(address, cid);
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, chainId]);

  function saveWallet(addr, cid) {
    if (addr) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ address: addr, chainId: cid }));
    }
  }

  // 连接 MetaMask
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('请先安装 MetaMask 钱包 (https://metamask.io)');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('未授权');
      const addr = accounts[0];
      const cid = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
      setAddress(addr);
      setChainId(cid);
      saveWallet(addr, cid);
      await refreshBalance(addr, cid);

      // 如果用户已登录且有 user id，把 wallet 地址关联到账户
      if (user) {
        await linkWalletToUser(addr);
      }
    } catch (e) {
      setError(e.message || '连接失败');
    } finally {
      setConnecting(false);
    }
  }, [user]);

  // 断开
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance('0');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 切换网络
  const switchNetwork = useCallback(async (targetChainKey = 'baseSepolia') => {
    if (!window.ethereum) return;
    const target = CHAINS[targetChainKey];
    if (!target) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + target.id.toString(16) }],
      });
    } catch (e) {
      // 如果网络不存在，尝试添加（这里只对已知的 network 有效）
      if (e.code === 4902) {
        setError(`请手动在 MetaMask 中添加 ${target.name} (chainId ${target.id})`);
      } else {
        setError(e.message);
      }
    }
  }, []);

  // 刷新 HPW 余额
  const refreshBalance = useCallback(async (addr = address, cid = chainId) => {
    if (!addr || !isHPWDeployed(cid)) {
      setBalance('0');
      return;
    }
    try {
      const chain = cid === CHAINS.base.id ? base : baseSepolia;
      const client = getPublicClient(chain);
      const tokenAddr = getHPWAddress(cid);
      const bal = await client.readContract({
        address: tokenAddr,
        abi: HPW_ABI_EXPORT,
        functionName: 'balanceOf',
        args: [addr],
      });
      setBalance(formatEther(bal));
    } catch (e) {
      console.warn('Failed to fetch HPW balance:', e.message);
      setBalance('0');
    }
  }, [address, chainId]);

  // 链上转账（HPW）
  const transferHPW = useCallback(async (toAddress, amountEth) => {
    if (!address || !window.ethereum) throw new Error('钱包未连接');
    if (!isHPWDeployed(chainId)) throw new Error('当前网络未部署 HPW');
    const chain = chainId === CHAINS.base.id ? base : baseSepolia;
    const walletClient = createWalletClient({
      chain,
      transport: custom(window.ethereum),
    });
    const hash = await walletClient.writeContract({
      address: getHPWAddress(chainId),
      abi: HPW_ABI_EXPORT,
      functionName: 'transfer',
      args: [toAddress, parseEther(amountEth)],
      account: address,
    });
    return hash;
  }, [address, chainId]);

  // 把 wallet 地址关联到用户账户
  async function linkWalletToUser(walletAddr) {
    if (!user) return;
    try {
      const result = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hpw_token') || ''}`,
        },
        body: JSON.stringify({ wallet_address: walletAddr }),
      });
      if (result.ok && updateUser) {
        const data = await result.json();
        updateUser({ ...user, walletAddress: walletAddr });
      }
    } catch (e) {
      console.warn('Failed to link wallet:', e.message);
    }
  }

  // 派生状态
  const isConnected = !!address;
  const isOnSupportedChain = isHPWDeployed(chainId);
  const chainName = chainId === CHAINS.baseSepolia.id ? 'Base Sepolia'
                  : chainId === CHAINS.base.id ? 'Base'
                  : chainId ? `Chain ${chainId}` : '未连接';
  const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  return {
    // 状态
    address,
    chainId,
    chainName,
    balance,
    isConnected,
    isOnSupportedChain,
    connecting,
    error,
    hasMetaMask,
    shortAddress,
    // 操作
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    transferHPW,
  };
}

export default useWallet;
