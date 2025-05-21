'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { searchRakutenBookByISBN } from '@/lib/api/rakuten-books';
import { saveBookToDB } from '@/lib/supabase/books';
import { useSearchStore } from '@/store/searchStore';
import { Book } from '@/types';

export default function ScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setSearchTerm, resetPagination, setUseRakuten } = useSearchStore();

  // デバッグモード用の状態
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugIsbn, setDebugIsbn] = useState('9784873119045');

  // 楽天APIを使用することを設定
  useEffect(() => {
    setUseRakuten(true);
    return () => {
      setUseRakuten(false);
    };
  }, [setUseRakuten]);

  // バーコードスキャン機能
  // 実際の実装では、QuaggaJSなどのライブラリを使用するとよいです
  const startScanning = async () => {
    setIsScanning(true);
    setError(null);

    try {
      // カメラへのアクセス許可を取得
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // 背面カメラを優先
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // ここではモック実装として、5秒後に固定のISBNでスキャンが成功したことにします
      setTimeout(() => {
        handleScan('9784873119045'); // プログラミング TypeScript のISBN
      }, 5000);
    } catch (err) {
      console.error('カメラへのアクセスに失敗しました:', err);
      setError('カメラへのアクセスに失敗しました。許可を確認してください。');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleScan = async (isbn: string) => {
    try {
      setIsScanning(false);
      stopScanning();

      console.log(`🔍 [スキャンデバッグ] ISBN "${isbn}" の検索を開始します...`);

      // 楽天Books APIを使ってISBNから書籍情報を取得
      // skipGenreFilterをtrueに設定してジャンルフィルタリングをスキップ
      console.log(
        `🔍 [スキャンデバッグ] searchRakutenBookByISBN呼び出し - ISBN: ${isbn}, skipGenreFilter: true`
      );
      const book = await searchRakutenBookByISBN(isbn, true);
      console.log(`🔍 [スキャンデバッグ] searchRakutenBookByISBN結果:`, book);

      if (!book) {
        console.error(`❌ [スキャンエラー] ISBN "${isbn}" に該当する書籍が見つかりませんでした`);
        setError(`ISBNコード ${isbn} に該当する書籍が見つかりませんでした。`);
        return;
      }

      console.log(`✅ [スキャン成功] ISBN "${isbn}" の書籍が見つかりました: "${book.title}"`);

      // 取得した書籍情報をDBに保存
      console.log(`📦 [スキャンデバッグ] 書籍情報をDBに保存します: ${book.title}`);
      const savedBook = await saveBookToDB(book);
      console.log(`📦 [スキャンデバッグ] 保存結果:`, savedBook);

      setScannedBook(savedBook || book);
    } catch (err) {
      console.error('❌ [スキャンエラー] 書籍情報の取得に失敗しました:', err);
      setError('書籍情報の取得に失敗しました。再度お試しください。');
    }
  };

  // 検索結果ページへ遷移
  const handleViewSearchResults = () => {
    if (scannedBook) {
      // 検索ストアに検索語をセット
      setSearchTerm(scannedBook.title);
      resetPagination();
      // 検索結果ページへ遷移
      router.push('/');
    }
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // デバッグ検証用のISBN検索実行
  const handleDebugSearch = () => {
    if (debugIsbn && debugIsbn.trim()) {
      handleScan(debugIsbn.trim());
    }
  };

  // デバッグモード切替（Prodではダブルタップで表示）
  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
  };

  return (
    <div className="container max-w-lg py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">バーコードスキャン</h1>
        <Button variant="ghost" className="ml-auto text-xs opacity-30" onClick={toggleDebugMode}>
          {isDebugMode ? '検証終了' : '検証'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ISBN バーコードをスキャン</CardTitle>
          <CardDescription>
            書籍の裏表紙または奥付に記載されたバーコードをカメラにかざしてください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isDebugMode && (
            <div className="space-y-4 mb-4 p-3 border border-yellow-300 bg-yellow-50 rounded-md">
              <h3 className="text-sm font-medium text-yellow-800">検証モード</h3>
              <div className="flex gap-2">
                <Input
                  value={debugIsbn}
                  onChange={e => setDebugIsbn(e.target.value)}
                  placeholder="ISBNを入力"
                  className="flex-1"
                />
                <Button onClick={handleDebugSearch} variant="outline">
                  検索
                </Button>
              </div>
              <p className="text-xs text-yellow-700">
                実際のISBNを入力して検索結果を検証できます。
              </p>
            </div>
          )}

          {!isScanning && !scannedBook && !isDebugMode && (
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
                <div className="absolute inset-0 border-2 border-primary/50 m-8 pointer-events-none" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                バーコードがフレーム内に収まるようにしてください
              </p>
              <Button variant="outline" onClick={stopScanning} className="w-full">
                キャンセル
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
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-medium">{scannedBook.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{scannedBook.author}</p>
                <p className="text-xs mt-2">ISBN: {scannedBook.isbn}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => router.push(`/book/${scannedBook.id}`)}
                >
                  詳細を見る
                </Button>
                <Button variant="secondary" className="flex-1" onClick={handleViewSearchResults}>
                  検索結果を見る
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setScannedBook(null)}>
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
