// Google Analyticsの型定義
declare global {
  interface Window {
    gtag: (command: 'config' | 'event', targetId: string, config?: Record<string, any>) => void;
  }
}

export {};
