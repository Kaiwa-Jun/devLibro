'use client';

import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { searchRakutenBookByISBN } from '@/lib/api/rakuten-books';
import { saveBookToDB } from '@/lib/supabase/books';
import { useSearchStore } from '@/store/searchStore';
import { Book } from '@/types';

export default function ScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    setSearchTerm: _setSearchTerm,
    resetPagination: _resetPagination,
    setUseRakuten,
  } = useSearchStore();
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const { user, loading } = useAuth();

  // 認証チェック：未ログインの場合はログインページにリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirectFrom=scan');
    }
  }, [user, loading, router]);

  // 楽天APIを使用することを設定
  useEffect(() => {
    setUseRakuten(true);
    return () => {
      setUseRakuten(false);
    };
  }, [setUseRakuten]);

  // バーコードスキャン機能（実際のカメラ読み取り実装）
  const startScanning = async () => {
    setIsScanning(true);
    setError(null);

    try {
      // ZXingのマルチフォーマットリーダーを初期化
      codeReaderRef.current = new BrowserMultiFormatReader();

      // 利用可能なビデオデバイスを取得
      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        throw new Error('カメラが見つかりませんでした');
      }

      // 背面カメラを優先して選択（またはデフォルトカメラ）
      const deviceId =
        videoInputDevices.length > 1
          ? videoInputDevices.find(
              device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear')
            )?.deviceId || videoInputDevices[0].deviceId
          : videoInputDevices[0].deviceId;

      if (!videoRef.current) {
        throw new Error('ビデオエレメントが見つかりませんでした');
      }

      // バーコード読み取りを開始
      codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          // バーコードが正常に読み取れた場合
          const scannedText = (result as unknown as { text: string }).text || String(result);

          // ISBNの形式かチェック（10桁または13桁の数字）
          const cleanedText = scannedText.replace(/[^0-9]/g, '');
          if (cleanedText.length === 10 || cleanedText.length === 13) {
            // 有効なISBNの場合
            handleScan(cleanedText);
          } else {
            // 無効な形式の場合
            setError(`読み取った値がISBN形式ではありません: ${scannedText}`);
          }
        } else if (err && !(err instanceof NotFoundException)) {
          // エラーが発生した場合（Not found以外）
          setError('バーコードの読み取りに失敗しました。再度お試しください。');
          setIsScanning(false);
        }
        // NotFoundException の場合は何もしない（読み取り継続）
      });
    } catch (_err) {
      setError('カメラの初期化に失敗しました。ページを再読み込みして再度お試しください。');
      setIsScanning(false);
    }
  };

  // スキャンを停止する関数
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };

  // ISBNから書籍を検索する関数
  const handleScan = async (isbn: string) => {
    try {
      setError(null);

      // 楽天Books APIから書籍情報を検索
      const bookData = await searchRakutenBookByISBN(isbn);

      if (!bookData) {
        setError(`ISBNコード「${isbn}」に該当する書籍が見つかりませんでした。`);
        return;
      }

      // 書籍をSupabaseに保存
      const savedBook = await saveBookToDB(bookData);

      if (savedBook) {
        setScannedBook(savedBook);
        setIsScanning(false);

        // スキャンを停止
        stopScanning();
      }
    } catch (_err) {
      setError('書籍情報の取得に失敗しました。再度お試しください。');
      setIsScanning(false);
    }
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // 別の本をスキャンする処理
  const handleStartNewScan = () => {
    setScannedBook(null);
    setError(null);
    // 少し遅延を入れてからスキャンを開始（UIの更新を待つため）
    setTimeout(() => {
      startScanning();
    }, 100);
  };

  // 認証状態読み込み中またはリダイレクト処理中は何も表示しない
  if (loading || !user) {
    return (
      <div className="container max-w-lg py-6">
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">認証状態を確認中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">バーコードスキャン</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ISBN バーコードをスキャン</CardTitle>
          <CardDescription>
            書籍の裏表紙または奥付に記載されたバーコードをカメラにかざしてください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isScanning && !scannedBook && (
            <Button onClick={startScanning} className="w-full">
              スキャン開始
            </Button>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* スキャンフレーム */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white/70 relative">
                    {/* 角のマーカー */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
                    {/* 中央のラインアニメーション */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-pulse"></div>
                  </div>
                </div>
                {/* スキャン状態表示 */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="bg-black/50 rounded-lg px-3 py-2">
                    <p className="text-white text-sm">バーコードをフレーム内に合わせてください</p>
                    <div className="flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      <span className="text-green-400 text-xs">スキャン中...</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                ISBN バーコード（13桁）をフレーム内に収めてください
              </p>
              <Button variant="outline" onClick={stopScanning} className="w-full">
                スキャンを停止
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mt-4">
              <p>{error}</p>
              <Button variant="outline" onClick={() => setError(null)} className="mt-2 w-full">
                再試行
              </Button>
            </div>
          )}

          {scannedBook && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted">
                {/* 書影 */}
                <div className="flex-shrink-0">
                  <img
                    src={scannedBook.img_url || '/placeholder-book.png'}
                    alt={scannedBook.title}
                    className="w-24 h-36 object-cover rounded-md shadow-sm"
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/placeholder-book.png';
                    }}
                  />
                </div>

                {/* 書籍情報 */}
                <div className="text-center w-full">
                  <h3 className="font-medium text-sm leading-5 truncate" title={scannedBook.title}>
                    {scannedBook.title}
                  </h3>
                  <p
                    className="text-sm text-muted-foreground mt-1 overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                    }}
                  >
                    {scannedBook.author}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => router.push(`/book/${scannedBook.id}`)}
                >
                  詳細を見る
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleStartNewScan}>
                  別の本をスキャン
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
