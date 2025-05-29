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

    console.log('🔍 レコメンドAPI開始:', { userId, limit, offset });

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

    console.log('👤 ユーザーデータ取得:', { userData, userError });

    if (userError || !userData) {
      return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 404 });
    }

    const userExperienceLevel = getExperienceLevel(userData.experience_years || 0);
    console.log('📊 ユーザー経験レベル:', {
      experienceYears: userData.experience_years,
      level: userExperienceLevel,
    });

    // ユーザーが既にレビューを書いている書籍IDを取得
    const { data: userReviews, error: userReviewsError } = await supabase
      .from('reviews')
      .select('book_id')
      .eq('user_id', userId);

    console.log('📝 ユーザーレビュー取得:', {
      count: userReviews?.length,
      error: userReviewsError,
    });

    if (userReviewsError) {
      return NextResponse.json({ error: 'ユーザーレビューの取得に失敗しました' }, { status: 500 });
    }

    const reviewedBookIds = new Set(userReviews?.map(review => review.book_id) || []);
    console.log('📝 レビュー済み書籍ID:', Array.from(reviewedBookIds));

    // ユーザーの本棚にある書籍IDを取得
    const { data: userBookshelf, error: bookshelfError } = await supabase
      .from('user_books')
      .select('book_id')
      .eq('user_id', userId);

    console.log('📚 本棚データ取得:', { count: userBookshelf?.length, error: bookshelfError });

    if (bookshelfError) {
      return NextResponse.json({ error: '本棚データの取得に失敗しました' }, { status: 500 });
    }

    const bookshelfBookIds = new Set(userBookshelf?.map(item => item.book_id) || []);
    console.log('📚 本棚の書籍ID:', Array.from(bookshelfBookIds));

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

    console.log('📚 レビューデータ取得:', { count: reviewsData?.length, error: reviewsError });

    if (reviewsError) {
      return NextResponse.json({ error: 'レビューデータの取得に失敗しました' }, { status: 500 });
    }

    // 書籍ごとにレビューをグループ化
    const bookReviewsMap = new Map<string, { book: Book; reviews: Review[] }>();
    let excludedCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviewsData?.forEach((item: any) => {
      if (!item.books) return;

      const bookId = item.books.id;

      // ユーザーが既にレビューを書いている書籍または本棚にある書籍は除外
      if (reviewedBookIds.has(bookId) || bookshelfBookIds.has(bookId)) {
        excludedCount++;
        console.log('🚫 除外された書籍:', {
          bookId,
          title: item.books.title,
          reason: reviewedBookIds.has(bookId) ? 'レビュー済み' : '本棚にあり',
        });
        return;
      }

      console.log('✅ 対象書籍:', {
        bookId,
        title: item.books.title,
      });

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

    console.log('📖 書籍グループ化完了:', {
      totalBooks: bookReviewsMap.size,
      excludedCount,
      reviewedBooksCount: reviewedBookIds.size,
      bookshelfBooksCount: bookshelfBookIds.size,
    });

    // 各書籍のレコメンドスコアを計算
    const recommendations: RecommendationWithBook[] = [];

    Array.from(bookReviewsMap.entries()).forEach(([bookId, { book, reviews }]) => {
      const score = calculateRecommendationScore(bookId, reviews, userExperienceLevel);

      console.log(`📊 書籍スコア計算: ${book.title}`, {
        bookId,
        reviewCount: reviews.length,
        score: score?.score,
        reasons: score?.reasons,
      });

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

    console.log('✅ レコメンド結果:', {
      totalRecommendations: recommendations.length,
      returnedCount: sortedRecommendations.length,
      topScores: sortedRecommendations
        .slice(0, 3)
        .map(r => ({ title: r.book.title, score: r.score })),
    });

    return NextResponse.json({
      recommendations: sortedRecommendations,
      userExperienceLevel,
      totalBooks: bookReviewsMap.size,
      excludedBooks: {
        reviewedCount: reviewedBookIds.size,
        bookshelfCount: bookshelfBookIds.size,
      },
    });
  } catch (error) {
    console.error('レコメンドAPI エラー:', error);
    return NextResponse.json({ error: 'レコメンドの取得に失敗しました' }, { status: 500 });
  }
}
