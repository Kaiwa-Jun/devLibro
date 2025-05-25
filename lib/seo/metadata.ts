import { Metadata } from 'next';

// ベースURL
export const siteConfig = {
  name: 'DevLibro',
  description: '開発者のための技術書レビュー・管理プラットフォーム',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/images/devlibro-logo.svg',
  twitter: {
    card: 'summary_large_image',
    site: '@devlibro',
  },
  defaultLocale: 'ja',
  supportedLocales: ['ja', 'en'],
  // Google Analytics関連情報
  analytics: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    privacyPolicyUrl: '/privacy-policy',
    cookieConsentEnabled: true,
  },
};

// 書籍タイプのJSON-LD向け型定義
export interface BookJsonLd {
  title: string;
  authors: string[];
  publisher?: string;
  publishDate?: string;
  description?: string;
  isbn?: string;
  image?: string;
  url?: string;
  genre?: string[];
}

/**
 * デフォルトのメタデータを生成
 */
export function getDefaultMetadata(): Metadata {
  // Google検証コード（文字列または未定義の場合に空配列を使用）
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? [process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION]
    : [];

  return {
    title: {
      default: `${siteConfig.name} - 技術書書評アプリ`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      type: 'website',
      locale: siteConfig.defaultLocale,
      url: siteConfig.url,
      title: siteConfig.name,
      description: siteConfig.description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.name,
      description: siteConfig.description,
      site: siteConfig.twitter.site,
      images: [siteConfig.ogImage],
    },
    alternates: {
      canonical: '/',
      languages: {
        ja: `${siteConfig.url}/ja`,
        en: `${siteConfig.url}/en`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
      apple: '/favicon.svg',
    },
    manifest: '/site.webmanifest',
    // 構造化データのアプリケーションのカテゴリ情報
    verification: {
      google: googleVerification,
    },
  };
}

/**
 * ページ固有のメタデータを生成
 */
export function generatePageMetadata({
  title,
  description,
  path = '',
  images = [siteConfig.ogImage],
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  images?: string[];
  noIndex?: boolean;
}): Metadata {
  const fullUrl = `${siteConfig.url}${path}`;

  return {
    title: title,
    description: description,
    openGraph: {
      url: fullUrl,
      title: title,
      description: description,
      images: images.map(image => ({
        url: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
        width: 1200,
        height: 630,
        alt: title,
      })),
    },
    twitter: {
      title: title,
      description: description,
      images: images,
    },
    alternates: {
      canonical: fullUrl,
      languages: {
        ja: `${siteConfig.url}/ja${path}`,
        en: `${siteConfig.url}/en${path}`,
      },
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

/**
 * 書影画像を正方形にリサイズするためのURL処理
 */
function processBookImageForTwitterCard(imageUrl: string): string {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // 楽天の画像URLの場合、正方形にリサイズ
  if (imageUrl.includes('thumbnail.image.rakuten.co.jp')) {
    // 既存のパラメータを削除して、正方形のパラメータを追加
    const baseUrl = imageUrl.split('?')[0];
    return `${baseUrl}?_ex=400x400`;
  }

  return imageUrl;
}

/**
 * 書籍ページ専用のメタデータを生成（書影画像に最適化）
 */
export function generateBookPageMetadata({
  title,
  description,
  path = '',
  bookImage,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  bookImage?: string;
  noIndex?: boolean;
}): Metadata {
  const fullUrl = `${siteConfig.url}${path}`;
  const originalImageUrl = bookImage?.startsWith('http')
    ? bookImage
    : `${siteConfig.url}${bookImage}`;
  const optimizedImageUrl = bookImage
    ? processBookImageForTwitterCard(originalImageUrl)
    : originalImageUrl;

  return {
    title: title,
    description: description,
    openGraph: {
      type: 'article',
      url: fullUrl,
      title: title,
      description: description,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 400,
          height: 400,
          alt: `${title} - DevLibro`,
          type: 'image/svg+xml',
        },
      ],
    },
    twitter: {
      card: 'summary', // DevLibroロゴを表示
      title: title,
      description: description,
      images: [siteConfig.ogImage], // 共通のDevLibroロゴを使用
      site: siteConfig.twitter.site,
    },
    alternates: {
      canonical: fullUrl,
      languages: {
        ja: `${siteConfig.url}/ja${path}`,
        en: `${siteConfig.url}/en${path}`,
      },
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
    // 画像関連のメタタグを一旦停止
    // other: {
    //   'twitter:image:alt': title || '書籍の書影',
    //   'og:image:secure_url': optimizedImageUrl,
    //   'og:image:width': '400',
    //   'og:image:height': '400',
    // },
  };
}

/**
 * 書籍ページ向けのJSON-LDを生成
 */
export function generateBookJsonLd(book: BookJsonLd): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: book.authors.map(author => ({
      '@type': 'Person',
      name: author,
    })),
    publisher: book.publisher
      ? {
          '@type': 'Organization',
          name: book.publisher,
        }
      : undefined,
    datePublished: book.publishDate,
    description: book.description,
    isbn: book.isbn,
    image: book.image,
    url: book.url,
    genre: book.genre,
  };
}
