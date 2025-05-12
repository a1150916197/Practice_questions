import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { getCache, setCache, QUESTION_BANKS_CACHE_KEY, BANK_QUESTIONS_CACHE_PREFIX } from '../services/cacheService';

// 定义缓存数据结构
interface CacheState {
  questionBanks: any[] | null;
  questions: Record<string, any[]>; // bankId -> questions[]
  isLoading: boolean;
  error: string | null;
}

// 定义缓存操作类型
type CacheAction =
  | { type: 'FETCH_BANKS_START' }
  | { type: 'FETCH_BANKS_SUCCESS'; payload: any[] }
  | { type: 'FETCH_BANKS_ERROR'; payload: string }
  | { type: 'FETCH_QUESTIONS_START'; bankId: string }
  | { type: 'FETCH_QUESTIONS_SUCCESS'; bankId: string; payload: any[] }
  | { type: 'FETCH_QUESTIONS_ERROR'; bankId: string; payload: string }
  | { type: 'CLEAR_CACHE' };

// 初始缓存状态
const initialState: CacheState = {
  questionBanks: null,
  questions: {},
  isLoading: false,
  error: null
};

// 缓存操作reducer
const cacheReducer = (state: CacheState, action: CacheAction): CacheState => {
  switch (action.type) {
    case 'FETCH_BANKS_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_BANKS_SUCCESS':
      // 写入本地缓存
      setCache(QUESTION_BANKS_CACHE_KEY, action.payload);
      return {
        ...state,
        questionBanks: action.payload,
        isLoading: false
      };
    case 'FETCH_BANKS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'FETCH_QUESTIONS_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_QUESTIONS_SUCCESS':
      // 写入本地缓存
      setCache(`${BANK_QUESTIONS_CACHE_PREFIX}${action.bankId}`, action.payload);
      return {
        ...state,
        questions: {
          ...state.questions,
          [action.bankId]: action.payload
        },
        isLoading: false
      };
    case 'FETCH_QUESTIONS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'CLEAR_CACHE':
      // 清空所有缓存
      localStorage.clear();
      return initialState;
    default:
      return state;
  }
};

// 创建缓存上下文
interface CacheContextProps {
  state: CacheState;
  clearCache: () => void;
  fetchQuestionBanks: (forceRefresh?: boolean) => Promise<any[]>;
  fetchQuestions: (bankId: string, forceRefresh?: boolean) => Promise<any[]>;
}

const CacheContext = createContext<CacheContextProps | undefined>(undefined);

// 提供缓存的Provider组件
export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cacheReducer, initialState);

  // 初始化时从localStorage加载缓存
  useEffect(() => {
    const cachedBanks = getCache<any[]>(QUESTION_BANKS_CACHE_KEY);
    if (cachedBanks) {
      dispatch({ type: 'FETCH_BANKS_SUCCESS', payload: cachedBanks });
    }
  }, []);

  // 清除所有缓存
  const clearCache = () => {
    dispatch({ type: 'CLEAR_CACHE' });
  };

  // 获取题库列表，支持强制刷新
  const fetchQuestionBanks = async (forceRefresh = false): Promise<any[]> => {
    // 如果不强制刷新且有缓存，直接返回缓存
    if (!forceRefresh && state.questionBanks) {
      return state.questionBanks;
    }

    // 如果不强制刷新且localStorage有缓存，使用缓存
    const cachedBanks = getCache<any[]>(QUESTION_BANKS_CACHE_KEY);
    if (!forceRefresh && cachedBanks) {
      dispatch({ type: 'FETCH_BANKS_SUCCESS', payload: cachedBanks });
      return cachedBanks;
    }

    // 否则从服务器获取
    dispatch({ type: 'FETCH_BANKS_START' });
    try {
      // 这里应该是实际的API调用，这里简化处理
      const response = await fetch('/api/question-banks');
      if (!response.ok) {
        throw new Error('获取题库失败');
      }
      const data = await response.json();
      dispatch({ type: 'FETCH_BANKS_SUCCESS', payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'FETCH_BANKS_ERROR', payload: '获取题库失败' });
      throw error;
    }
  };

  // 获取题目列表，支持强制刷新
  const fetchQuestions = async (bankId: string, forceRefresh = false): Promise<any[]> => {
    // 如果不强制刷新且有缓存，直接返回缓存
    if (!forceRefresh && state.questions[bankId]) {
      return state.questions[bankId];
    }

    // 如果不强制刷新且localStorage有缓存，使用缓存
    const cacheKey = `${BANK_QUESTIONS_CACHE_PREFIX}${bankId}`;
    const cachedQuestions = getCache<any[]>(cacheKey);
    if (!forceRefresh && cachedQuestions) {
      dispatch({ type: 'FETCH_QUESTIONS_SUCCESS', bankId, payload: cachedQuestions });
      return cachedQuestions;
    }

    // 否则从服务器获取
    dispatch({ type: 'FETCH_QUESTIONS_START', bankId });
    try {
      // 这里应该是实际的API调用，这里简化处理
      const response = await fetch(`/api/questions/bank/${bankId}`);
      if (!response.ok) {
        throw new Error('获取题目失败');
      }
      const data = await response.json();
      dispatch({ type: 'FETCH_QUESTIONS_SUCCESS', bankId, payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'FETCH_QUESTIONS_ERROR', bankId, payload: '获取题目失败' });
      throw error;
    }
  };

  return (
    <CacheContext.Provider
      value={{
        state,
        clearCache,
        fetchQuestionBanks,
        fetchQuestions
      }}
    >
      {children}
    </CacheContext.Provider>
  );
};

// 自定义钩子，便于使用缓存上下文
export const useCache = (): CacheContextProps => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache必须在CacheProvider内部使用');
  }
  return context;
}; 