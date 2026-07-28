import { useEffect } from 'react';

/**
 * 动态修改 document.title 和 og 标签
 * 用法: useDocumentTitle('问题详情', '看黎曼猜想的讨论')
 */
export function useDocumentTitle(title, description) {
  useEffect(() => {
    const suffix = 'HardProblems.World';
    const finalTitle = title ? `${title} · ${suffix}` : suffix;
    document.title = finalTitle;

    setMeta('description', description || '用 AI 解决 8 大学科 64 个世界级硬问题，链上积分奖励。');
    setMeta('og:title', finalTitle, true);
    if (description) {
      setMeta('og:description', description, true);
    }
  }, [title, description]);
}

function setMeta(name, value, og = false) {
  // 统一：name 是不带 og: 前缀的；查询时如果 og=true，要拼 og:
  const fullName = og ? `og:${name}` : name;
  const attr = og ? 'property' : 'name';
  let el = document.head.querySelector(`meta[${attr}="${fullName}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, fullName);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}
