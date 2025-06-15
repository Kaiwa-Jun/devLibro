'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import WelcomeModal from '@/components/modals/WelcomeModal';
import { getUserProfile } from '@/lib/supabase/client';

export default function ExperienceCheck() {
  const { user, loading } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [checkingExperience, setCheckingExperience] = useState(true);

  useEffect(() => {
    // ユーザーがログインしていて、ロード中でない場合のみチェック
    if (user && !loading) {
      const checkExperienceYears = async () => {
        setCheckingExperience(true);
        try {
          const { data, error } = await getUserProfile(user.id);

          if (error) {
            return;
          }

          // 経験年数が設定されていないか、初期値の0の場合もモーダルを表示
          // 初回ログイン時に自動的に0が設定されるため、0も未設定とみなす
          const shouldShowModal =
            !data ||
            data.experience_years === undefined ||
            data.experience_years === null ||
            data.experience_years === 0;

          if (shouldShowModal) {
            setShowWelcomeModal(true);
          }
        } catch (_error) {
          // エラー処理
        } finally {
          setCheckingExperience(false);
        }
      };

      checkExperienceYears();
    } else {
      setCheckingExperience(false);
    }
  }, [user, loading]);

  const handleCloseModal = () => {
    setShowWelcomeModal(false);
  };

  const shouldRenderModal = user && !loading && !checkingExperience;

  // 何もレンダリングせず、モーダルのみを管理
  return (
    <>
      {shouldRenderModal && <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseModal} />}
    </>
  );
}
