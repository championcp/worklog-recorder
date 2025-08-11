import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// 配置 Testing Library
configure({ 
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000
});

// Mock window对象
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockLocalStorage
});

// Mock fetch
global.fetch = jest.fn();

// 抑制console警告（仅在测试环境）
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // 忽略特定的警告
  if (
    args[0]?.includes?.('componentWillReceiveProps') ||
    args[0]?.includes?.('React.createFactory') ||
    args[0]?.includes?.('findDOMNode')
  ) {
    return;
  }
  originalConsoleWarn.call(console, ...args);
};

// 全局测试超时
jest.setTimeout(10000);