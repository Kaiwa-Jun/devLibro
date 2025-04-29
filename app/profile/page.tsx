import { Metadata } from 'next';

import BookshelfTabs from '@/components/profile/BookshelfTabs';
import ShareButton from '@/components/profile/ShareButton';
import UserInfo from '@/components/profile/UserInfo';

export const metadata: Metadata = {
  title: 'マイ本棚 | DevLibro',
  description: 'あなたの技術書コレクションを管理しましょう',
};

export default function ProfilePage() {
  return (
    <div className="space-y-6 pb-8 pt-2">
      <div className="flex justify-between items-start">
        <UserInfo />
        <ShareButton />
      </div>
      <BookshelfTabs />
    </div>
  );
}
