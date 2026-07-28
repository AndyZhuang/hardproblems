import React from 'react';
import { useI18n, SUPPORTED_LANGUAGES } from '../lib/i18n.js';

/**
 * 语言切换器 - 下拉菜单
 */
export default function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2.5 py-1.5 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-1"
        aria-label="Switch language"
      >
        🌐 <span className="hidden sm:inline">{SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.short}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-slate-800 ${
                l.code === lang ? 'text-indigo-300' : 'text-slate-200'
              }`}
            >
              <span>{l.label}</span>
              {l.code === lang && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
