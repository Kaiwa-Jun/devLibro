import { Metadata } from 'next';

// ベースURL
export const siteConfig = {
  name: 'DevLibro',
  description: '開発者のための技術書レビュー・管理プラットフォーム',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',
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
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
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
  const imageUrl = bookImage?.startsWith('http') ? bookImage : `${siteConfig.url}${bookImage}`;

  return {
    title: title,
    description: description,
    openGraph: {
      url: fullUrl,
      title: title,
      description: description,
      images: bookImage
        ? [
            {
              url: imageUrl,
              width: 400,
              height: 600,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary', // 書影画像には summary カードを使用
      title: title,
      description: description,
      images: bookImage ? [imageUrl] : undefined,
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
