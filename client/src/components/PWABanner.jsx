import React from 'react';
import { usePWA } from '../hooks/usePWA.js';
import { useI18n, t } from '../lib/i18n.js';

export default function PWABanner() {
  const { installPrompt, isOnline, install, swUpdate, applyUpdate, isInstalled } = usePWA();
  const { lang } = useI18n();
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed && !swUpdate && isOnline) return null;

  return (
    <div className="relative z-50">
      {!isOnline && (
        <div className="bg-amber-500/15 text-amber-200 text-center text-xs py-1.5 px-3 border-b border-amber-500/30">
          📡 {t('pwa.offline')}
        </div>
      )}

      {swUpdate && (
        <div className="bg-indigo-600/95 text-white text-center text-sm py-2 px-3 flex items-center justify-center gap-3">
          <span>🆕 {t('pwa.update')}</span>
          <button onClick={applyUpdate} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs">{t('pwa.updateNow')}</button>
          <button onClick={() => setDismissed(true)} className="px-2 py-1 text-white/60 hover:text-white text-xs">✕</button>
        </div>
      )}

      {installPrompt && !isInstalled && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center text-sm py-2.5 px-3 flex items-center justify-center gap-3">
          <span className="hidden sm:inline">📱 {t('pwa.install')}</span>
          <span className="sm:hidden">📱</span>
          <button
            onClick={async () => { const ok = await install(); if (!ok) setDismissed(true); }}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium"
          >
            {t('pwa.installShort')}
          </button>
          <button onClick={() => setDismissed(true)} className="px-2 py-1 text-white/60 hover:text-white text-xs" aria-label={t('common.close')}>✕</button>
        </div>
      )}
    </div>
  );
}
