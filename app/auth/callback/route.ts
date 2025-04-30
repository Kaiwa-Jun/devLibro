import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// OAuth認証後のリダイレクト処理
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // OAuthセッションを確立
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 認証後はホーム画面にリダイレクト
  return NextResponse.redirect(new URL('/', request.url));
}
