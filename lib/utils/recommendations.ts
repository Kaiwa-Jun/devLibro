import { ExperienceLevel, RecommendationScore, Review } from '@/types';

/**
 * 経験年数から経験レベルを取得
 */
export const getExperienceLevel = (experienceYears: number): ExperienceLevel => {
  if (experienceYears <= 2) {
    return ExperienceLevel.BEGINNER;
  } else if (experienceYears <= 4) {
    return ExperienceLevel.INTERMEDIATE;
  } else {
    return ExperienceLevel.EXPERT;
  }
};

/**
 * 経験レベルに適した難易度範囲を取得
 * より柔軟な範囲設定で、経験者ほど幅広い難易度を許容
 */
export const getOptimalDifficultyRange = (level: ExperienceLevel): [number, number] => {
  switch (level) {
    case ExperienceLevel.BEGINNER:
      // 初学者：簡単〜普通レベルを推奨
      return [1, 2.5];
    case ExperienceLevel.INTERMEDIATE:
      // 中級者：普通〜やや難しいレベルを推奨
      return [2, 4];
    case ExperienceLevel.EXPERT:
      // 上級者：やや難しい〜難しいレベルを推奨（ただし簡単な書籍も許容）
      return [3, 5];
    default:
      return [1, 5];
  }
};

/**
 * レビューデータから書籍のレコメンドスコアを計算
 */
export const calculateRecommendationScore = (
  bookId: string,
  reviews: Review[],
  userExperienceLevel: ExperienceLevel
): RecommendationScore | null => {
  if (reviews.length === 0) {
    return null;
  }

  // 同じ経験レベルのレビューを抽出
  const sameLevelReviews = reviews.filter(review => {
    const reviewLevel = getExperienceLevel(review.experience_years);
    return reviewLevel === userExperienceLevel;
  });

  // 隣接する経験レベルのレビューも含める（±1レベル）
  const adjacentLevelReviews = reviews.filter(review => {
    const reviewLevel = getExperienceLevel(review.experience_years);
    const levels = [ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE, ExperienceLevel.EXPERT];
    const userLevelIndex = levels.indexOf(userExperienceLevel);
    const reviewLevelIndex = levels.indexOf(reviewLevel);
    return Math.abs(userLevelIndex - reviewLevelIndex) <= 1;
  });

  // 平均難易度を計算
  const avgDifficulty =
    reviews.reduce((sum, review) => sum + review.difficulty, 0) / reviews.length;

  // 適切な難易度範囲を取得
  const [minDifficulty, maxDifficulty] = getOptimalDifficultyRange(userExperienceLevel);

  // スコア計算の各要素
  const experienceMatchScore = calculateExperienceMatchScore(
    sameLevelReviews.length,
    reviews.length
  );
  const difficultyScore = calculateDifficultyScore(
    avgDifficulty,
    minDifficulty,
    maxDifficulty,
    userExperienceLevel
  );
  const positiveRateScore = calculatePositiveRateScore(adjacentLevelReviews);
  const reviewCountScore = calculateReviewCountScore(reviews.length);

  // 重み付きスコア計算
  const totalScore =
    experienceMatchScore * 0.4 +
    difficultyScore * 0.3 +
    positiveRateScore * 0.2 +
    reviewCountScore * 0.1;

  // レコメンド理由を生成
  const reasons = generateRecommendationReasons(
    sameLevelReviews.length,
    avgDifficulty,
    minDifficulty,
    maxDifficulty,
    adjacentLevelReviews,
    reviews.length
  );

  return {
    bookId,
    score: Math.round(totalScore * 100) / 100, // 小数点2桁まで
    reasons,
    avgDifficulty: Math.round(avgDifficulty * 10) / 10, // 小数点1桁まで
    reviewCount: reviews.length,
    experienceLevelMatch: sameLevelReviews.length,
  };
};

/**
 * 経験年数マッチングスコアを計算 (0-100)
 */
const calculateExperienceMatchScore = (sameLevelCount: number, totalCount: number): number => {
  if (totalCount === 0) return 0;
  const ratio = sameLevelCount / totalCount;
  return Math.min(ratio * 100, 100);
};

/**
 * 難易度適合スコアを計算 (0-100)
 * 経験年数に応じて難易度マッチングの偏りを調整
 */
const calculateDifficultyScore = (
  avgDifficulty: number,
  minDifficulty: number,
  maxDifficulty: number,
  userExperienceLevel: ExperienceLevel
): number => {
  if (avgDifficulty >= minDifficulty && avgDifficulty <= maxDifficulty) {
    return 100;
  } else if (avgDifficulty < minDifficulty) {
    // 簡単すぎる場合の処理
    const distance = minDifficulty - avgDifficulty;

    // 経験年数に応じてペナルティを調整
    let penalty: number;
    switch (userExperienceLevel) {
      case ExperienceLevel.BEGINNER:
        // 初学者：簡単な書籍でも許容度高め
        penalty = distance * 20;
        break;
      case ExperienceLevel.INTERMEDIATE:
        // 中級者：バランス良く
        penalty = distance * 25;
        break;
      case ExperienceLevel.EXPERT:
        // 上級者：簡単すぎる書籍は退屈になりがち
        penalty = distance * 35;
        break;
      default:
        penalty = distance * 30;
    }

    return Math.max(100 - penalty, 10); // 最低10点は保証
  } else {
    // 難しすぎる場合の処理
    const distance = avgDifficulty - maxDifficulty;

    // 経験年数に応じてペナルティを調整
    let penalty: number;
    switch (userExperienceLevel) {
      case ExperienceLevel.BEGINNER:
        // 初学者：難しい書籍は大幅減点
        penalty = distance * 60;
        break;
      case ExperienceLevel.INTERMEDIATE:
        // 中級者：やや厳しめ
        penalty = distance * 45;
        break;
      case ExperienceLevel.EXPERT:
        // 上級者：難しい書籍も挑戦可能
        penalty = distance * 30;
        break;
      default:
        penalty = distance * 40;
    }

    return Math.max(100 - penalty, 5); // 最低5点は保証
  }
};

/**
 * 高評価率スコアを計算 (0-100)
 */
const calculatePositiveRateScore = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;

  // 難易度3以下を「高評価」とみなす
  const positiveReviews = reviews.filter(review => review.difficulty <= 3);
  const positiveRate = positiveReviews.length / reviews.length;

  return positiveRate * 100;
};

/**
 * レビュー数スコアを計算 (0-100)
 */
const calculateReviewCountScore = (reviewCount: number): number => {
  // レビュー数が多いほど信頼性が高い
  // 10件以上で満点、それ以下は線形に減少
  return Math.min((reviewCount / 10) * 100, 100);
};

/**
 * レコメンド理由を生成
 */
const generateRecommendationReasons = (
  sameLevelCount: number,
  avgDifficulty: number,
  minDifficulty: number,
  maxDifficulty: number,
  adjacentLevelReviews: Review[],
  totalReviewCount: number
): string[] => {
  const reasons: string[] = [];

  // 同じ経験レベルのレビューが多い
  if (sameLevelCount >= 3) {
    reasons.push('🎯 あなたと同じ経験レベルの方に高評価');
  }

  // 適切な難易度
  if (avgDifficulty >= minDifficulty && avgDifficulty <= maxDifficulty) {
    reasons.push('📚 適切な難易度レベル');
  }

  // 高評価率が高い
  if (adjacentLevelReviews.length > 0) {
    const positiveRate =
      adjacentLevelReviews.filter(r => r.difficulty <= 3).length / adjacentLevelReviews.length;
    if (positiveRate >= 0.7) {
      reasons.push('⭐ 多くの方から高評価');
    }
  }

  // レビュー数が多い
  if (totalReviewCount >= 5) {
    reasons.push('📊 豊富なレビューデータ');
  }

  // 理由がない場合のデフォルト
  if (reasons.length === 0) {
    reasons.push('💡 おすすめの一冊');
  }

  return reasons;
};
