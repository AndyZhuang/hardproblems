// WalletButton - MetaMask 连接按钮 + 链上 HPW 余额
// 状态：未连接 / 已连接 / 已连接但链不对
// 自带 useWallet 状态（不依赖父组件传 props）

import { useState } from 'react';
import { useI18n } from '../lib/i18n.js';
import { useWallet } from '../hooks/useWallet.js';

export default function WalletButton() {
  const wallet = useWallet();
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);

  // 没有 MetaMask：显示安装引导
  if (!wallet.hasMetaMask) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs transition"
        title="Install MetaMask to earn real on-chain HPW tokens"
      >
        🦊 MetaMask
      </a>
    );
  }

  // 未连接
  if (!wallet.isConnected) {
    return (
      <button
        onClick={wallet.connect}
        disabled={wallet.connecting}
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-medium transition disabled:opacity-50"
        title="Connect MetaMask to earn real on-chain HPW"
      >
        {wallet.connecting ? '...' : <>🦊 {lang === 'zh-CN' ? '连钱包' : 'Connect'}</>}
      </button>
    );
  }

  // 已连接：显示余额
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
          wallet.isOnSupportedChain
            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200'
            : 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200'
        }`}
      >
        <span className="font-mono">{wallet.shortAddress}</span>
        <span className="text-amber-300">⚡ {parseFloat(wallet.balance).toFixed(0)}</span>
      </button>

      {open && (
        <>
          {/* 点击外部关闭 */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-40 overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <div className="text-xs text-slate-500 mb-1">{lang === 'zh-CN' ? '已连接钱包' : 'Connected wallet'}</div>
              <div className="font-mono text-sm text-slate-200 break-all">{wallet.address}</div>
            </div>

            <div className="p-3 border-b border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{lang === 'zh-CN' ? '网络' : 'Network'}</span>
                <span className={wallet.isOnSupportedChain ? 'text-emerald-300' : 'text-amber-300'}>
                  {wallet.chainName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-500">{lang === 'zh-CN' ? 'HPW 余额' : 'HPW balance'}</span>
                <span className="text-amber-300 font-mono">⚡ {parseFloat(wallet.balance).toFixed(2)}</span>
              </div>
            </div>

            {!wallet.isOnSupportedChain && (
              <button
                onClick={() => { wallet.switchNetwork('baseSepolia'); setOpen(false); }}
                className="w-full px-3 py-2.5 text-xs text-left text-amber-200 hover:bg-amber-500/10 border-b border-white/5"
              >
                ⚠️ {lang === 'zh-CN' ? '切换到 Base Sepolia' : 'Switch to Base Sepolia'}
              </button>
            )}

            <button
              onClick={() => { wallet.disconnect(); setOpen(false); }}
              className="w-full px-3 py-2.5 text-xs text-left text-red-300 hover:bg-red-500/10"
            >
              {lang === 'zh-CN' ? '断开钱包' : 'Disconnect wallet'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
