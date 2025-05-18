// Google Analyticsの測定ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// ページビューをトラッキングする
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// イベントをトラッキングする
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// カスタムイベントのための一般的な関数
export const trackEvent = (eventName: string, params = {}) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window.gtag('event', eventName, params);
};

// 特定のイベントのためのユーティリティ関数
export const trackBookView = (bookId: string, bookTitle: string) => {
  trackEvent('book_view', {
    book_id: bookId,
    book_title: bookTitle,
  });
};

export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

export const trackLogin = (method: string) => {
  trackEvent('login', {
    method: method,
  });
};

// 追加のイベントトラッキング関数
export const trackAddToShelf = (bookId: string, bookTitle: string, shelfName: string) => {
  trackEvent('add_to_shelf', {
    book_id: bookId,
    book_title: bookTitle,
    shelf_name: shelfName,
  });
};

export const trackReviewSubmit = (bookId: string, bookTitle: string, rating: number) => {
  trackEvent('review_submit', {
    book_id: bookId,
    book_title: bookTitle,
    rating: rating,
  });
};

export const trackShare = (bookId: string, bookTitle: string, shareMethod: string) => {
  trackEvent('share', {
    book_id: bookId,
    book_title: bookTitle,
    share_method: shareMethod,
  });
};

export const trackSignup = (method: string, success: boolean) => {
  trackEvent('signup', {
    method: method,
    success: success,
  });
};

export const trackError = (errorType: string, errorMessage: string, errorSource: string) => {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    error_source: errorSource,
  });
};

// 開発環境でのデバッグ用
export const debugMode = () => {
  return process.env.NODE_ENV === 'development';
};
