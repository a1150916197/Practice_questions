// 缓存服务 - 用于减少API请求，优化性能

// 缓存失效时间（毫秒）
export const CACHE_TTL = 3600000; // 1小时

// 题库列表缓存键
export const QUESTION_BANKS_CACHE_KEY = 'question_banks';
// 题目缓存键前缀
export const BANK_QUESTIONS_CACHE_PREFIX = 'bank_questions_';
// 用户错题缓存键
export const WRONG_QUESTIONS_CACHE_KEY = 'wrong_questions';

/**
 * 设置缓存
 * @param key 缓存键
 * @param data 要缓存的数据
 */
export const setCache = (key: string, data: any): void => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.warn('设置缓存失败:', error);
    // 如果存储失败（例如配额已满），清理一些可能过期的缓存
    clearExpiredCaches();
  }
};

/**
 * 获取缓存
 * @param key 缓存键
 * @returns 缓存的数据，或null（如果缓存不存在或已过期）
 */
export const getCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    
    // 检查缓存是否过期
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.warn('获取缓存失败:', error);
    return null;
  }
};

/**
 * 删除缓存
 * @param key 缓存键
 */
export const removeCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('删除缓存失败:', error);
  }
};

/**
 * 清理所有过期的缓存
 */
export const clearExpiredCaches = (): void => {
  try {
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;
        
        const { timestamp } = JSON.parse(cached);
        if (now - timestamp > CACHE_TTL) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // 如果解析某个缓存失败，跳过并继续
        continue;
      }
    }
  } catch (error) {
    console.warn('清理过期缓存失败:', error);
  }
};

/**
 * 清理所有缓存
 */
export const clearAllCaches = (): void => {
  try {
    // 仅清理我们的应用缓存，保留其他localStorage条目
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // 只清理我们知道的缓存键
      if (key === QUESTION_BANKS_CACHE_KEY || 
          key === WRONG_QUESTIONS_CACHE_KEY || 
          key.startsWith(BANK_QUESTIONS_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    // 删除所有标记的键
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('清理所有缓存失败:', error);
  }
}; 