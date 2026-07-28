import React from 'react';

/**
 * 顶层错误边界：捕获组件渲染错误，渲染友好提示，
 * 提供"重置"和"反馈"链接，避免白屏。
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // 生产环境上报到日志服务
    if (import.meta.env.PROD) {
      console.error('[ErrorBoundary]', error, info);
      // 可在此接 Sentry/自定义日志
    } else {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-lg w-full text-center space-y-6">
            <div className="text-6xl">💥</div>
            <h1 className="text-2xl font-bold text-white">出了点问题</h1>
            <p className="text-slate-300">
              页面渲染时遇到了一个意外错误。可以刷新重试，或者回到首页继续探索。
            </p>
            {import.meta.env.DEV && (
              <pre className="text-left text-xs text-red-300 bg-slate-900 p-4 rounded overflow-auto max-h-40">
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
              >
                重试
              </button>
              <a
                href="/"
                className="px-5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
              >
                回到首页
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
