/**
 * アフィリエイト設定
 * 環境変数からアフィリエイトIDを取得して一元管理するための設定ファイル
 */
export const affiliateConfig = {
  amazon: {
    affiliateId: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_ID || '',
  },
  rakuten: {
    affiliateId: process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID || '',
  },
};
