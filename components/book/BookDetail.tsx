'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import WriteReviewButton from '@/components/book/WriteReviewButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookByIdFromDB, saveBookToDB } from '@/lib/supabase/books';
import { getDifficultyInfo } from '@/lib/utils';
import { Book } from '@/types';

import PurchaseLinks from './PurchaseLinks';

type BookDetailProps = {
  id: string;
};

export default function BookDetail({ id }: BookDetailProps) {
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [internalBookId, setInternalBookId] = useState<string | null>(null); // 明示的にDB IDを保持
  const hasAttemptedSave = useRef(false); // 保存を試みたかどうかを追跡
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); // 説明文の展開状態

  useEffect(() => {
    // Supabaseから書籍データを取得
    const fetchBook = async () => {
      // StrictModeによる二重実行の場合、2回目は処理をスキップ
      if (hasAttemptedSave.current) {
        return;
      }

      setLoading(true);
      setError(null);
      hasAttemptedSave.current = true; // 処理を開始したことをマーク

      try {
        console.log('書籍情報を取得します。ID:', id);
        const bookData = await getBookByIdFromDB(id);

        if (bookData) {
          console.log('取得した書籍データ:', bookData);
          setBook(bookData);

          // 重要: 内部DB IDを抽出して保存
          // bookData自体にはsupabaseの内部IDが含まれている場合があるが、
          // これは直接アクセスできないため、代わりにobjとして扱い抽出する
          const bookObj = bookData as unknown as Record<string, unknown>;
          if (bookObj && typeof bookObj === 'object') {
            // まず数値IDを探す（これが内部DB ID）
            if ('id' in bookObj && typeof bookObj.id === 'number') {
              console.log('内部IDを使用:', bookObj.id);
              setInternalBookId(String(bookObj.id));
            } else if ('internal_id' in bookObj && bookObj.internal_id) {
              console.log('internal_idを使用:', bookObj.internal_id);
              setInternalBookId(String(bookObj.internal_id));
            }
            // rawData内部に含まれている可能性も確認
            else if (
              'rawData' in bookObj &&
              bookObj.rawData &&
              typeof bookObj.rawData === 'object' &&
              bookObj.rawData !== null &&
              'id' in (bookObj.rawData as Record<string, unknown>) &&
              typeof (bookObj.rawData as Record<string, unknown>).id === 'number'
            ) {
              const rawId = (bookObj.rawData as Record<string, unknown>).id;
              console.log('rawData.idを使用:', rawId);
              setInternalBookId(String(rawId));
            }
            // 実際はGoogle Books IDなどの場合があるが、数値だけの場合はそのまま使用
            else if (typeof bookObj.id === 'string' && !isNaN(Number(bookObj.id))) {
              console.log('数値文字列IDを使用:', bookObj.id);
              setInternalBookId(bookObj.id);
            }
            // それでも見つからない場合はnullのまま
            else {
              console.log('内部IDが見つかりません。表示ID:', id);
              setInternalBookId(id); // 表示IDをそのまま使用
            }
          }

          return; // 成功したので終了
        }

        console.error('Supabaseからの書籍データ取得に失敗しました: ID =', id);
        setError(`書籍データが見つかりませんでした (ID: ${id})`);

        // セッションストレージからの復元を試みる
        try {
          const storedBook = sessionStorage.getItem(`book_${id}`);
          if (storedBook) {
            const parsedBook = JSON.parse(storedBook);
            console.log('セッションストレージから書籍を復元:', parsedBook);
            setBook(parsedBook);
            setError(null); // エラーをクリア

            // 重要: セッションストレージから取得できた場合は、
            // 詳細ページにアクセスしたということなので、DBに保存する
            // ただし、既に保存済みかどうかを確認するフラグをセットしておく
            const savedFlag = sessionStorage.getItem(`book_${id}_saved`);
            console.log(`書籍ID ${id} の保存フラグ状態:`, savedFlag);

            // 保存フラグがない、または pending の場合のみ保存を試みる
            if (!savedFlag || savedFlag === 'pending') {
              try {
                console.log('ユーザーが詳細ページを表示したため、書籍をDBに保存します');

                // 書籍の保存を開始する前に「処理中」フラグを設定して、他のコンポーネントが同時に保存しないようにする
                sessionStorage.setItem(`book_${id}_saved`, 'pending');

                // フレームワークとプログラミング言語フィールドが無い場合は空の配列を追加
                const bookToSave = {
                  ...parsedBook,
                  programming_languages:
                    parsedBook.programming_languages || parsedBook.programmingLanguages || [],
                  frameworks: parsedBook.frameworks || [],
                };

                // 保存処理を直接実行
                console.log('セッションストレージの書籍データをDBに保存します:', bookToSave);
                const savedBook = await saveBookToDB(bookToSave);
                console.log('書籍保存の結果:', savedBook);

                // 認証エラーやRLSエラーのチェック
                if (savedBook && typeof savedBook === 'object' && 'error' in savedBook) {
                  console.warn(
                    '書籍保存時にエラーが発生しましたが、表示は継続します:',
                    (savedBook as Book & { error: { code: string; message: string } }).error
                  );

                  // エラータイプに応じたログ出力
                  if (
                    (savedBook as Book & { error: { code: string; message: string } }).error
                      .code === 'NOT_AUTHENTICATED'
                  ) {
                    console.warn('認証されていないため書籍情報は保存されませんでした');
                  } else if (
                    (savedBook as Book & { error: { code: string; message: string } }).error
                      .code === '42501'
                  ) {
                    console.warn('セキュリティポリシーにより書籍情報は保存されませんでした');
                  }

                  // エラーがあっても書籍情報は表示するために元の書籍情報を使用
                  sessionStorage.setItem(`book_${id}_saved`, 'error');
                  return;
                }

                if (savedBook) {
                  console.log('書籍をDBに保存しました:', savedBook);
                  // 新しいDBデータをセット (内部IDがあるほうが今後の参照に便利)
                  setBook(savedBook);

                  // 保存された内部IDを抽出
                  const savedObj = savedBook as Record<string, unknown>;
                  if (savedObj && typeof savedObj === 'object') {
                    if (
                      'rawData' in savedObj &&
                      savedObj.rawData &&
                      typeof savedObj.rawData === 'object' &&
                      savedObj.rawData !== null &&
                      'id' in (savedObj.rawData as Record<string, unknown>)
                    ) {
                      const rawId = (savedObj.rawData as Record<string, unknown>).id;
                      console.log('保存後のrawData.idを使用:', rawId);
                      setInternalBookId(String(rawId));
                    } else if (
                      'id' in savedObj &&
                      (typeof savedObj.id === 'number' ||
                        (typeof savedObj.id === 'string' && !isNaN(Number(savedObj.id))))
                    ) {
                      console.log('保存後のIDを使用:', savedObj.id);
                      setInternalBookId(String(savedObj.id));
                    }
                  }

                  // 保存成功のフラグを設定
                  sessionStorage.setItem(`book_${id}_saved`, 'true');
                }
              } catch (saveError) {
                console.error('書籍のDB保存エラー:', saveError);
                // エラー発生時にはエラーフラグを設定（再試行を防ぐ）
                sessionStorage.setItem(`book_${id}_saved`, 'error');
              }
            } else {
              console.log(
                'この書籍はすでに保存済みまたは処理中です。重複保存を回避します。フラグ状態:',
                savedFlag
              );
            }
          }
        } catch (storageError) {
          console.error('セッションストレージからの復元に失敗:', storageError);
        }
      } catch (e) {
        console.error('書籍の取得中にエラーが発生:', e);
        setError('書籍データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  // 書籍情報が取得できるまでローディング表示
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="h-[240px] w-[180px] flex-shrink-0" />
            <div className="space-y-4 flex-1">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // エラー発生時またはデータなしの場合のフォールバック表示
  if (!book || error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-destructive">
              <Info className="h-5 w-5" />
              <h3 className="font-medium">書籍情報の取得に失敗しました</h3>
            </div>
            {error && <p className="text-sm text-muted-foreground">{error}</p>}
            <p className="text-sm text-muted-foreground">
              お手数ですが、トップページに戻って再度お試しください。
            </p>
            <Button variant="outline" asChild>
              <Link href="/">トップページに戻る</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const difficultyInfo = getDifficultyInfo(book.avg_difficulty);
  const DifficultyIcon = difficultyInfo.icon;

  // タイトルから主要なプログラミング言語を抽出する関数
  const getPrimaryLanguageFromTitle = (title: string): string | null => {
    const lowerTitle = title.toLowerCase();

    // 言語判定の優先順位（タイトルに明示的に言及されている言語）
    if (
      lowerTitle.includes('react') ||
      lowerTitle.includes('vue.js') ||
      lowerTitle.includes('next.js') ||
      lowerTitle.includes('node.js')
    ) {
      return 'JavaScript';
    }
    if (lowerTitle.includes('javascript')) return 'JavaScript';
    if (lowerTitle.includes('typescript')) return 'TypeScript';
    if (lowerTitle.includes('python')) return 'Python';
    if (lowerTitle.includes('ruby')) return 'Ruby';
    if (lowerTitle.includes('php')) return 'PHP';
    if (lowerTitle.includes('c#') || lowerTitle.includes('c シャープ')) return 'C#';
    if (lowerTitle.includes('c++')) return 'C++';
    if (
      lowerTitle.includes('c言語') ||
      lowerTitle.includes('cプログラミング') ||
      lowerTitle.includes('c プログラミング')
    )
      return 'C';
    if (
      lowerTitle.includes('r言語') ||
      lowerTitle.includes('rプログラミング') ||
      lowerTitle.includes('r プログラミング')
    )
      return 'R';
    if (lowerTitle.includes('java') && !lowerTitle.includes('javascript')) return 'Java';
    if (lowerTitle.includes('go ') || lowerTitle.includes('go言語')) return 'Go';
    if (lowerTitle.includes('swift')) return 'Swift';
    if (lowerTitle.includes('kotlin')) return 'Kotlin';
    if (lowerTitle.includes('rust')) return 'Rust';
    if (lowerTitle.includes('sql')) return 'SQL';
    if (lowerTitle.includes('html') || lowerTitle.includes('css')) return 'HTML/CSS';

    return null;
  };

  // タイトルから抽出した主要な言語
  const primaryLanguage = getPrimaryLanguageFromTitle(book.title);
  console.log(`書籍「${book.title}」から抽出した主要言語:`, primaryLanguage);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-[320px] w-[240px] flex-shrink-0 mx-auto md:mx-0 bg-muted"
          >
            <Image
              src={book.img_url}
              alt={book.title}
              fill
              className="object-contain"
              sizes="240px"
            />
          </motion.div>

          <div className="flex-1 space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <p className="text-muted-foreground">{book.author}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2"
            >
              {/* タイトルから抽出した主要な言語のタグ */}
              {primaryLanguage && (
                <Badge key={primaryLanguage} variant="outline" className="border">
                  {primaryLanguage}
                </Badge>
              )}

              {/* フレームワークタグ */}
              {book.frameworks &&
                book.frameworks.length > 0 &&
                book.frameworks
                  .filter(framework => {
                    // タイトルに含まれるフレームワークのみをフィルタリング
                    return book.title.toLowerCase().includes(framework.toLowerCase());
                  })
                  .map(framework => (
                    <Badge key={framework} variant="outline" className="border">
                      {framework}
                    </Badge>
                  ))}

              {/* 難易度タグ */}
              {difficultyInfo.label !== '不明' && (
                <div
                  className={`text-xs py-0.5 px-2 rounded-full whitespace-nowrap w-fit min-w-[4rem] flex-shrink-0 font-medium flex items-center justify-center border ${
                    difficultyInfo.color === 'difficulty-easy'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : difficultyInfo.color === 'difficulty-somewhat-easy'
                        ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                        : difficultyInfo.color === 'difficulty-normal'
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : difficultyInfo.color === 'difficulty-somewhat-hard'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : difficultyInfo.color === 'difficulty-hard'
                              ? 'bg-purple-50 text-purple-600 border-purple-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <DifficultyIcon className="h-3 w-3 flex-shrink-0 mr-0.5" />
                  <span>{difficultyInfo.label}</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative">
                <motion.div
                  className="overflow-hidden text-sm text-muted-foreground"
                  initial={{ height: 'auto' }}
                  animate={{
                    height: isDescriptionExpanded ? 'auto' : '4.5rem',
                    transition: { duration: 0.3, ease: 'easeInOut' },
                  }}
                >
                  {book.description}
                  {!isDescriptionExpanded && book.description && book.description.length > 150 && (
                    <motion.div
                      className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-b from-transparent via-card/70 to-card"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </motion.div>
                {book.description && book.description.length > 150 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className={`text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium flex items-center ${
                      !isDescriptionExpanded
                        ? 'relative z-10 bg-card/70 px-2 py-1 rounded-full backdrop-blur-sm'
                        : ''
                    }`}
                  >
                    {isDescriptionExpanded ? '閉じる' : '続きを読む'}
                    <motion.span
                      className="ml-1 text-xs inline-block"
                      animate={{ rotate: isDescriptionExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      ▼
                    </motion.span>
                  </button>
                )}
              </div>
            </motion.div>

            <PurchaseLinks
              isbn={book.isbn}
              title={book.title}
              bookId={internalBookId || undefined}
            />

            <div className="mt-6">
              <WriteReviewButton bookId={internalBookId || id} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
