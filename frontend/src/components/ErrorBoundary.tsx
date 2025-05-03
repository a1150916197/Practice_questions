import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Pick<ErrorBoundaryState, 'hasError' | 'error'> {
    // 更新状态，下次渲染时显示备用UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    this.setState({ errorInfo });
    console.error('组件渲染错误:', error, errorInfo);
    
    // 可以在这里将错误上报到服务器
    // 例如: reportError(error, errorInfo);
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 如果提供了fallback组件，则使用它
      if (fallback) {
        return fallback;
      }

      // 默认错误UI
      return (
        <div 
          style={{
            margin: '20px',
            padding: '20px',
            border: '1px solid #f5222d',
            borderRadius: '4px',
            backgroundColor: '#fff1f0'
          }}
        >
          <h2 style={{ color: '#f5222d' }}>组件渲染错误</h2>
          <p>抱歉，页面显示出现问题</p>
          {error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
              <summary>查看错误详情</summary>
              <p>{error.toString()}</p>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '5px 12px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    // 正常情况下渲染子组件
    return children;
  }
}

export default ErrorBoundary; 