import { generatePageMetadata } from '@/lib/seo/metadata';
import { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata({
  title: 'プライバシーポリシー',
  description: 'DevLibroのプライバシーポリシーです。ユーザー情報の取り扱いについて説明しています。',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. 個人情報の収集について</h2>
        <p className="mb-4">
          DevLibro（以下、「当サービス」）は、サービス提供のために必要な範囲で個人情報を収集することがあります。
          収集する情報には、ユーザー名、メールアドレス、プロフィール情報などが含まれます。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. アクセス解析ツールについて</h2>
        <p className="mb-4">
          当サービスでは、サービスの利用状況を把握するために、Google Analyticsを利用しています。
          Google Analyticsは、Cookieを使用してデータを収集します。
          このデータは匿名で収集されており、個人を特定するものではありません。
        </p>
        <p className="mb-4">
          Google Analyticsの詳細については、
          <a
            href="https://policies.google.com/privacy?hl=ja"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Googleのプライバシーポリシー
          </a>
          をご確認ください。
        </p>
        <p className="mb-4">
          なお、Google Analyticsのトラッキングを無効にしたい場合は、
          <a
            href="https://tools.google.com/dlpage/gaoptout?hl=ja"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Google Analyticsオプトアウトアドオン
          </a>
          をご利用いただけます。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. 個人情報の利用目的</h2>
        <p className="mb-4">収集した個人情報は、以下の目的で利用します：</p>
        <ul className="list-disc pl-6 mb-4">
          <li>サービスの提供・維持・改善</li>
          <li>ユーザーからのお問い合わせへの対応</li>
          <li>新機能や更新情報のお知らせ</li>
          <li>利用状況の分析によるサービス改善</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. 個人情報の第三者提供</h2>
        <p className="mb-4">
          法令に基づく場合や、人の生命・身体・財産の保護のために必要がある場合を除き、
          収集した個人情報を第三者に提供することはありません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. Cookieの使用について</h2>
        <p className="mb-4">
          当サービスでは、ユーザー体験の向上やサービス改善のためにCookieを使用しています。
          ブラウザの設定によりCookieの受け入れを拒否することも可能ですが、
          その場合、一部の機能が正常に動作しない可能性があります。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. プライバシーポリシーの変更</h2>
        <p className="mb-4">
          当サービスは、必要に応じてプライバシーポリシーを変更することがあります。
          変更した場合は、当ページにて通知します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. お問い合わせ</h2>
        <p className="mb-4">
          プライバシーポリシーに関するお問い合わせは、以下の連絡先までお願いいたします。
        </p>
        <p className="mb-4">
          Twitter(X):{' '}
          <a
            href="https://x.com/crew_runteq38"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            @crew_runteq38
          </a>{' '}
          のDMにてお問い合わせください
        </p>
      </section>

      <div className="text-sm text-gray-500 mt-12">最終更新日: 2025年5月18日</div>
    </div>
  );
}
