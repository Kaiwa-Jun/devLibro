import { Metadata } from 'next';

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
        {/*
          Radix UI互換性問題解決後、以下のコンポーネントを復活させてください
          <UserInfo />
          <ShareButton />
        */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">ユーザー名</h1>
          <p className="text-muted-foreground">読書時間: 0時間 / 読了冊数: 0冊</p>
        </div>
        <div>
          <button className="px-4 py-2 border rounded-md">SNS共有</button>
        </div>
      </div>
      <div className="mt-6">
        {/*
          Radix UI互換性問題解決後、以下のコンポーネントを復活させてください
          <BookshelfTabs />
        */}
        <p className="text-center py-8">開発中のため、本棚の表示は準備中です。</p>
      </div>
    </div>
  );
}
