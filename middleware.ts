import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

/**
 * 各リクエストでセッション状態を更新するミドルウェア
 */
export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    // セッションを更新・リフレッシュする
    await supabase.auth.getSession();

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

/**
 * ミドルウェアを適用するパス
 * 静的アセットとapi/healthを除外
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
