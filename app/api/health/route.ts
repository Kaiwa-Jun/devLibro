import { NextResponse } from 'next/server';

// ヘルスチェックエンドポイント
// ミドルウェアを通さないようにするため
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }, { status: 200 });
}
