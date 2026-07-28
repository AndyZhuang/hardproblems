import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** 切换路由时自动滚到顶部 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
