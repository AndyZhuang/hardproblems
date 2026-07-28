// 极简 i18n：自实现，避免引入 i18next/react-intl 等大依赖
// 用法：
//   import { t, useI18n, setLanguage } from '@/lib/i18n';
//   <p>{t('home.title')}</p>
//   const { lang, setLang } = useI18n();

import { useEffect, useState, useCallback } from 'react';
import zhCN from './locales/zh-CN.js';
import enUS from './locales/en-US.js';

const STORAGE_KEY = 'hpw.lang';
const SUPPORTED = ['zh-CN', 'en-US'];
const DEFAULT = 'zh-CN';

const DICTS = { 'zh-CN': zhCN, 'en-US': enUS };

function detectInitialLang() {
  if (typeof window === 'undefined') return DEFAULT;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;
  const nav = (window.navigator.language || 'en').toLowerCase();
  if (nav.startsWith('zh')) return 'zh-CN';
  return 'en-US';
}

let currentLang = detectInitialLang();
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try { fn(currentLang); } catch (e) { console.error(e); }
  });
}

/**
 * 取翻译键值
 *  支持占位符：t('hello', { name: 'World' }) -> "Hello, World"
 *  支持 fallback：找不到时返回 key
 *  支持嵌套键：t('home.title')
 */
export function t(key, vars) {
  const dict = DICTS[currentLang] || DICTS[DEFAULT];
  const parts = String(key).split('.');
  let val = dict;
  for (const p of parts) {
    if (val && typeof val === 'object' && p in val) val = val[p];
    else {
      // 找不到，尝试 fallback 到默认语言
      const fallback = DICTS[DEFAULT];
      let fv = fallback;
      for (const fp of parts) {
        if (fv && typeof fv === 'object' && fp in fv) fv = fv[fp];
        else { return key; }
      }
      val = fv;
      break;
    }
  }
  if (typeof val !== 'string') return key;
  if (vars) {
    return val.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
  }
  return val;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  currentLang = lang;
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch {}
    document.documentElement.lang = lang.split('-')[0];
  }
  notify();
}

export function useI18n() {
  const [lang, setLocalLang] = useState(currentLang);
  useEffect(() => {
    const fn = (l) => setLocalLang(l);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const setLangStable = useCallback((l) => setLang(l), []);
  return { lang, setLang: setLangStable, t };
}

export const SUPPORTED_LANGUAGES = SUPPORTED.map((code) => ({
  code,
  label: DICTS[code].__meta?.label || code,
  short: DICTS[code].__meta?.short || code
}));
