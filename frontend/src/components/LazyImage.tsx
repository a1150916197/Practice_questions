import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  placeholderSrc?: string;
  style?: React.CSSProperties;
}

/**
 * 懒加载图片组件
 * 只有当图片进入视口时才会加载
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjwvc3ZnPg==',
  style,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // 创建 IntersectionObserver 实例
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当图片进入视口
          if (entry.isIntersecting) {
            // 设置真实的图片源
            setImageSrc(src);
            // 停止观察
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px加载
        threshold: 0.01, // 只要有1%进入视口就开始加载
      }
    );

    // 开始观察图片元素
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    // 组件卸载时清理
    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, [src]);

  // 处理图片加载完成
  const handleImageLoaded = () => {
    setImageLoaded(true);
  };

  // 处理图片加载失败
  const handleImageError = () => {
    console.warn(`图片加载失败: ${src}`);
    // 可以设置一个错误占位图
    setImageSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmY2NjY2Ij7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+');
  };

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={`lazy-image ${className || ''} ${imageLoaded ? 'loaded' : 'loading'}`}
      style={{
        opacity: imageLoaded ? 1 : 0.5,
        transition: 'opacity 0.3s',
        ...style,
      }}
      onLoad={handleImageLoaded}
      onError={handleImageError}
    />
  );
};

export default LazyImage;