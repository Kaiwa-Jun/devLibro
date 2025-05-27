import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { calculateRecommendationScore, getExperienceLevel } from '@/lib/utils/recommendations';
import { Book, RecommendationWithBook, Review } from '@/types';

// 動的ルートとしてマーク
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '6');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // ユーザーの経験年数を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('experience_years')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 404 });
    }

    const userExperienceLevel = getExperienceLevel(userData.experience_years || 0);

    // レビューがある書籍を取得（書籍情報も含む）
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(
        `
        *,
        books (*)
      `
      )
      .not('books', 'is', null);

    if (reviewsError) {
      return NextResponse.json({ error: 'レビューデータの取得に失敗しました' }, { status: 500 });
    }

    // 書籍ごとにレビューをグループ化
    const bookReviewsMap = new Map<string, { book: Book; reviews: Review[] }>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviewsData?.forEach((item: any) => {
      if (!item.books) return;

      const book: Book = {
        id: item.books.id,
        isbn: item.books.isbn || '',
        title: item.books.title || '',
        author: item.books.author || '',
        language: item.books.language || '',
        categories: item.books.categories || [],
        img_url: item.books.img_url || '',
        avg_difficulty: item.books.avg_difficulty || 0,
        description: item.books.description,
        programmingLanguages: item.books.programming_languages,
        frameworks: item.books.frameworks,
        publisherName: item.books.publisher_name,
        itemUrl: item.books.item_url,
      };

      const review: Review = {
        id: item.id,
        user_id: item.user_id,
        user_name: item.user_name || '匿名',
        book_id: item.book_id,
        difficulty: item.difficulty,
        experience_years: item.experience_years,
        comment: item.comment,
        created_at: item.created_at,
        anonymous: item.display_type === 'anon',
      };

      if (!bookReviewsMap.has(book.id)) {
        bookReviewsMap.set(book.id, { book, reviews: [] });
      }
      bookReviewsMap.get(book.id)!.reviews.push(review);
    });

    // 各書籍のレコメンドスコアを計算
    const recommendations: RecommendationWithBook[] = [];

    Array.from(bookReviewsMap.entries()).forEach(([bookId, { book, reviews }]) => {
      const score = calculateRecommendationScore(bookId, reviews, userExperienceLevel);

      if (score && score.score > 0) {
        recommendations.push({
          book,
          score: score.score,
          reasons: score.reasons,
          avgDifficulty: score.avgDifficulty,
          reviewCount: score.reviewCount,
          experienceLevelMatch: score.experienceLevelMatch,
        });
      }
    });

    // スコア順にソートしてページネーション適用
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(offset, offset + limit);

    return NextResponse.json({
      recommendations: sortedRecommendations,
      userExperienceLevel,
      totalBooks: bookReviewsMap.size,
    });
  } catch (error) {
    return NextResponse.json({ error: 'レコメンドの取得に失敗しました' }, { status: 500 });
  }
}
