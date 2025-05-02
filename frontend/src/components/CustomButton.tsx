import React, { memo, ButtonHTMLAttributes } from 'react';

export interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

// 使用React.memo包装组件以避免不必要的重渲染
const CustomButton = memo(({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
  disabled = false,
  className = '',
  style,
  ...rest 
}: CustomButtonProps) => {
  // 使用内联样式代替CSS库，减少依赖
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'background-color 0.2s, opacity 0.2s',
    border: 'none',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
  };
  
  // 尺寸样式
  const sizeStyles = {
    small: {
      padding: '6px 12px',
      fontSize: '14px',
    },
    medium: {
      padding: '8px 16px',
      fontSize: '16px',
    },
    large: {
      padding: '12px 24px',
      fontSize: '18px',
    },
  };
  
  // 变体样式
  const variantStyles = {
    primary: {
      backgroundColor: '#1890ff',
      color: '#fff',
    },
    secondary: {
      backgroundColor: '#f0f0f0',
      color: '#000',
    },
    danger: {
      backgroundColor: '#ff4d4f',
      color: '#fff',
    },
    success: {
      backgroundColor: '#52c41a',
      color: '#fff',
    },
    warning: {
      backgroundColor: '#faad14',
      color: '#fff',
    },
  };
  
  // 合并所有样式
  const computedStyle = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };
  
  return (
    <button
      style={computedStyle}
      className={className}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
});

// 为React DevTools显示组件名称
CustomButton.displayName = 'CustomButton';

export default CustomButton; 