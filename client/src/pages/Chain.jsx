import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useI18n, t } from '../lib/i18n.js';

export default function Chain() {
  const { lang } = useI18n();
  useDocumentTitle(
    lang === 'zh-CN' ? '区块链浏览器' : 'Blockchain Explorer',
    lang === 'zh-CN' ? 'HardProblems 链上区块与交易实时浏览' : 'Real-time on-chain blocks and transactions'
  );
  const [info, setInfo] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [txs, setTxs] = useState([]);
  const [validation, setValidation] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.chainInfo().catch(() => null),
      api.blocks({ limit: 20 }).catch(() => ({ blocks: [] })),
      api.transactions({ limit: 30 }).catch(() => ({ transactions: [] })),
      api.validate().catch(() => ({ valid: true, length: 0 }))
    ]).then(([i, b, t, v]) => {
      setInfo(i);
      setBlocks(b?.blocks || []);
      setTxs(t?.transactions || []);
      setValidation(v);
    }).finally(() => setLoading(false));
    const timer = setInterval(() => {
      api.chainInfo().then(setInfo).catch(() => {});
      api.blocks({ limit: 20 }).then(r => setBlocks(r?.blocks || [])).catch(() => setBlocks([]));
      api.transactions({ limit: 30 }).then(r => setTxs(r?.transactions || [])).catch(() => setTxs([]));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadBlock = async (id) => {
    const r = await api.block(id);
    setSelectedBlock(r);
  };

  if (loading) return <div className="container-page py-20 text-center text-slate-400">{t('common.loading')}</div>;

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-bold">⛓ {t('chain.title')}</h1>
        <p className="text-slate-400 mt-2 text-sm">{t('chain.subtitle')}</p>
      </div>

      {info && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="链高度" value={info.blockCount} sub="区块" />
          <Stat label="总交易" value={info.txCount} sub="笔" />
          <Stat label="总供应" value={info.totalSupply} sub="HPW" />
          <Stat label="链状态" value={info.valid ? '✅ 有效' : '❌ 异常'} sub={validation?.length ? `${validation.length} 块` : ''} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 区块列表 */}
        <div>
          <h2 className="text-xl font-display font-bold mb-3">📦 最新区块</h2>
          <div className="space-y-2 max-h-[700px] overflow-y-auto scrollbar-thin pr-2">
            {blocks.length === 0 ? (
              <div className="card text-center text-slate-500 py-8">暂无区块</div>
            ) : blocks.map(b => (
              <button key={b.id} onClick={() => loadBlock(b.id)}
                className={`w-full text-left card hover:border-violet-400/40 transition-all ${selectedBlock?.block?.id === b.id ? 'border-violet-400/60 bg-violet-500/5' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm text-violet-300">#{b.index_num}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">{b.hash.slice(0, 24)}…</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">{b.tx_count} 笔交易</div>
                    <div className="text-xs text-slate-500">{new Date(b.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 详情 */}
        <div>
          {selectedBlock ? (
            <BlockDetail data={selectedBlock} />
          ) : (
            <div className="card text-center text-slate-500 py-16">
              <div className="text-4xl mb-2">👈</div>
              点左侧区块查看交易明细
            </div>
          )}
        </div>
      </div>

      {/* 最新交易 */}
      <div className="mt-8">
        <h2 className="text-xl font-display font-bold mb-3">📨 最新交易</h2>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                <th className="px-4 py-2.5">交易 ID</th>
                <th className="px-4 py-2.5">类型</th>
                <th className="px-4 py-2.5">接收方</th>
                <th className="px-4 py-2.5 text-right">金额</th>
                <th className="px-4 py-2.5 text-right">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {txs.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">暂无交易</td></tr>
              ) : txs.map(t => (
                <tr key={t.id} className="hover:bg-white/5">
                  <td className="px-4 py-2.5 font-mono text-xs text-violet-300">{t.id.slice(0, 12)}…</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${t.type === 'reward' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>{t.type}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{t.to_address.slice(0, 16)}…</td>
                  <td className="px-4 py-2.5 text-right font-mono text-amber-300">+{t.amount}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-500">{new Date(t.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="card text-center">
      <div className="text-2xl sm:text-3xl font-display font-bold gradient-text">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}{sub && ` (${sub})`}</div>
    </div>
  );
}

function BlockDetail({ data }) {
  const { block, transactions } = data;
  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-3">📦 区块 #{block.index_num}</h2>
      <div className="card space-y-2 text-sm">
        <Field label="哈希" value={block.hash} mono />
        <Field label="父哈希" value={block.prev_hash} mono />
        <Field label="Merkle Root" value={block.merkle_root} mono />
        <Field label="Nonce" value={block.nonce} mono />
        <Field label="时间" value={new Date(block.timestamp).toLocaleString('zh-CN', { hour12: false })} />
        <Field label="交易数" value={block.tx_count} />
      </div>
      <h3 className="text-sm font-bold text-slate-300 mt-4 mb-2">交易明细</h3>
      <div className="space-y-1.5">
        {transactions.length === 0 ? <div className="text-slate-500 text-sm">无（创世区块）</div> :
          transactions.map(t => (
            <div key={t.id} className="card p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs text-violet-300 truncate">{t.id}</div>
                <div className="font-mono text-amber-300 whitespace-nowrap">+{t.amount} HPW</div>
              </div>
              <div className="text-xs text-slate-400 mt-1 truncate">
                <span className={`badge mr-1 ${t.type === 'reward' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>{t.type}</span>
                {t.note}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono truncate">→ {t.to_address}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-slate-500 w-20 flex-shrink-0">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} text-slate-200 break-all`}>{value}</span>
    </div>
  );
}
