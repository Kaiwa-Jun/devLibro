'use client';

import { useCallback } from 'react';

import * as gtag from '@/lib/analytics/gtag';

/**
 * Google Analyticsトラッキングのためのカスタムフック
 */
export const useAnalytics = () => {
  // 書籍詳細閲覧
  const trackBookView = useCallback((bookId: string, bookTitle: string) => {
    gtag.trackBookView(bookId, bookTitle);
  }, []);

  // 検索実行
  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    gtag.trackSearch(searchTerm, resultsCount);
  }, []);

  // 書棚に追加
  const trackAddToShelf = useCallback((bookId: string, bookTitle: string, shelfName: string) => {
    gtag.trackAddToShelf(bookId, bookTitle, shelfName);
  }, []);

  // レビュー投稿
  const trackReviewSubmit = useCallback((bookId: string, bookTitle: string, rating: number) => {
    gtag.trackReviewSubmit(bookId, bookTitle, rating);
  }, []);

  // 共有アクション
  const trackShare = useCallback((bookId: string, bookTitle: string, shareMethod: string) => {
    gtag.trackShare(bookId, bookTitle, shareMethod);
  }, []);

  // ログイン
  const trackLogin = useCallback((method: string) => {
    gtag.trackLogin(method);
  }, []);

  // サインアップ
  const trackSignup = useCallback((method: string, success: boolean) => {
    gtag.trackSignup(method, success);
  }, []);

  // エラー追跡
  const trackError = useCallback((errorType: string, errorMessage: string, errorSource: string) => {
    gtag.trackError(errorType, errorMessage, errorSource);
  }, []);

  // 汎用イベント追跡
  const trackEvent = useCallback((eventName: string, params = {}) => {
    gtag.trackEvent(eventName, params);
  }, []);

  return {
    trackBookView,
    trackSearch,
    trackAddToShelf,
    trackReviewSubmit,
    trackShare,
    trackLogin,
    trackSignup,
    trackError,
    trackEvent,
  };
};
