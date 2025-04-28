import React, { useRef, ReactNode } from 'react';
import { Card } from 'antd';
import { CardProps } from 'antd/lib/card';

interface SwipeableCardProps extends CardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 50,
  ...cardProps
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  // 处理滑动事件
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchEndX.current - touchStartX.current;
    
    if (Math.abs(distance) > swipeThreshold) {
      if (distance > 0 && onSwipeRight) {
        // 右滑
        onSwipeRight();
      } else if (distance < 0 && onSwipeLeft) {
        // 左滑
        onSwipeLeft();
      }
    }
    
    // 重置
    touchStartX.current = null;
    touchEndX.current = null;
  };
  
  return (
    <Card
      {...cardProps}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </Card>
  );
};

export default SwipeableCard; 