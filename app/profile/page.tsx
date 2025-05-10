import { Metadata } from 'next';

import BookshelfTabs from '@/components/profile/BookshelfTabs';
import UserInfo from '@/components/profile/UserInfo';

/**
 * Radix UIコンポーネント互換性問題のため一時的にコメントアウト
 * ビルドエラー解決後に以下のインポートを復活させてください
 */
// import BookshelfTabs from '@/components/profile/BookshelfTabs';
// import ShareButton from '@/components/profile/ShareButton';
// import UserInfo from '@/components/profile/UserInfo';

export const metadata: Metadata = {
  title: 'マイ本棚 | DevLibro',
  description: 'あなたの技術書コレクションを管理しましょう',
};

export default function ProfilePage() {
  return (
    <div className="space-y-6 pb-8 pt-2">
      <div className="flex justify-between items-start">
        <UserInfo />
        {/* SNS共有ボタンは後で実装するためコメントアウト */}
        {/* <ShareButton /> */}
      </div>
      <div className="mt-6">
        <BookshelfTabs />
      </div>
    </div>
  );
}
