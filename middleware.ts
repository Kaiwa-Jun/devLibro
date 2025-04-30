import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

/**
 * 各リクエストでセッション状態を更新するミドルウェア
 */
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // セッションを更新・リフレッシュする
  await supabase.auth.getSession();

  return res;
}

/**
 * ミドルウェアを適用するパス
 * すべてのパスに適用
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
