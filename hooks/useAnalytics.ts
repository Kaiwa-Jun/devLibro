'use client';

import * as gtag from '@/lib/analytics/gtag';
import { useCallback } from 'react';

/**
 * Google Analyticsのイベントを簡単に使用するためのカスタムフック
 */
export function useAnalytics() {
  // 汎用イベントトラッキング
  const trackEvent = useCallback((eventName: string, params = {}) => {
    gtag.trackEvent(eventName, params);
  }, []);

  // 書籍表示イベント
  const trackBookView = useCallback((bookId: string, bookTitle: string) => {
    gtag.trackBookView(bookId, bookTitle);
  }, []);

  // 検索イベント
  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    gtag.trackSearch(searchTerm, resultsCount);
  }, []);

  // ログインイベント
  const trackLogin = useCallback((method: string) => {
    gtag.trackLogin(method);
  }, []);

  // 本棚追加イベント
  const trackAddToShelf = useCallback((bookId: string, bookTitle: string, shelfName: string) => {
    gtag.trackAddToShelf(bookId, bookTitle, shelfName);
  }, []);

  // レビュー投稿イベント
  const trackReviewSubmit = useCallback((bookId: string, bookTitle: string, rating: number) => {
    gtag.trackReviewSubmit(bookId, bookTitle, rating);
  }, []);

  // シェアイベント
  const trackShare = useCallback((bookId: string, bookTitle: string, shareMethod: string) => {
    gtag.trackShare(bookId, bookTitle, shareMethod);
  }, []);

  // サインアップイベント
  const trackSignup = useCallback((method: string, success: boolean) => {
    gtag.trackSignup(method, success);
  }, []);

  // エラー報告イベント
  const trackError = useCallback((errorType: string, errorMessage: string, errorSource: string) => {
    gtag.trackError(errorType, errorMessage, errorSource);
  }, []);

  // ユーザーアクションイベント
  const trackAction = useCallback(
    (action: string, category: string, label?: string, value?: number) => {
      gtag.event({ action, category, label, value });
    },
    []
  );

  // デバッグモードの状態を取得
  const isDebugMode = gtag.debugMode();

  return {
    trackEvent,
    trackBookView,
    trackSearch,
    trackLogin,
    trackAddToShelf,
    trackReviewSubmit,
    trackShare,
    trackSignup,
    trackError,
    trackAction,
    isDebugMode,
  };
}
