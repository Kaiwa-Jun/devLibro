import { generatePageMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'プライバシーポリシー',
  description: '当サイトのプライバシーポリシーについて説明します。',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">プライバシーポリシー</h1>
      <div className="prose max-w-none dark:prose-invert">
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. 収集する情報</h2>
        <p>
          当サイトでは、サービス向上のためにGoogle
          Analyticsを利用して匿名のアクセス情報を収集しています。これには以下の情報が含まれます：
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>閲覧したページ</li>
          <li>サイト内での行動</li>
          <li>参照元</li>
          <li>使用デバイス、ブラウザ情報</li>
          <li>おおよその位置情報</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Cookieの使用</h2>
        <p>
          当サイトでは、ユーザーエクスペリエンスの向上とサービス利用状況の分析のためにCookieを使用しています。Cookieはブラウザに保存される小さなテキストファイルで、当サイトの利用状況を記録するために使用されます。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. 情報の利用目的</h2>
        <p>収集した情報は以下の目的で利用されます：</p>
        <ul className="list-disc pl-6 mb-4">
          <li>サービスの利用状況分析</li>
          <li>サイトの改善</li>
          <li>ユーザーエクスペリエンスの向上</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. 第三者への情報提供</h2>
        <p>
          当サイトでは、法的要請がある場合を除き、収集した個人情報を第三者に提供することはありません。ただし、匿名化された統計データについては、パートナーと共有する場合があります。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. オプトアウト</h2>
        <p>
          ユーザーはCookieの使用を拒否することができます。ブラウザの設定を変更してCookieを無効にすることで、当サイトのCookieの使用を防ぐことができますが、一部のサービス機能が正しく動作しない場合があります。
        </p>
        <p>
          また、以下のリンクからGoogle Analyticsのオプトアウトができます：
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Google Analyticsオプトアウトアドオン
          </a>
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. プライバシーポリシーの変更</h2>
        <p>
          当サイトは、必要に応じてプライバシーポリシーを変更することがあります。重要な変更がある場合は、サイト上で通知します。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. お問い合わせ</h2>
        <p>
          プライバシーポリシーに関するご質問やご不明点がある場合は、
          <a href="/contact" className="text-blue-500 hover:underline">
            お問い合わせフォーム
          </a>
          からご連絡ください。
        </p>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          最終更新日: 2023年12月1日
        </div>
      </div>
    </div>
  );
}
