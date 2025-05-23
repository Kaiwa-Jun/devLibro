import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// OAuth認証後のリダイレクト処理
export async function GET(request: NextRequest) {
  console.log('=== Auth Callback Debug Info ===');

  const requestUrl = new URL(request.url);
  console.log('Request URL:', requestUrl.toString());
  console.log('Request origin:', requestUrl.origin);

  const code = requestUrl.searchParams.get('code');
  console.log('OAuth code present:', !!code);

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      // OAuthセッションを確立
      const result = await supabase.auth.exchangeCodeForSession(code);
      console.log('Session exchange result:', {
        session: !!result.data?.session,
        user: !!result.data?.user,
        error: result.error,
      });
    } catch (error) {
      console.error('Session exchange error:', error);
    }
  }

  // 適切なリダイレクト先URLを決定
  console.log('Environment variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL_URL:', process.env.VERCEL_URL);
  console.log('NEXT_PUBLIC_VERCEL_URL:', process.env.NEXT_PUBLIC_VERCEL_URL);

  // 本番環境ではVERCEL_URLを使用、それ以外では現在のオリジンを使用
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : requestUrl.origin;
  console.log('Base URL determined:', baseUrl);

  const finalRedirectUrl = `${baseUrl}/books`;
  console.log('Final redirect URL:', finalRedirectUrl);
  console.log('=== End Auth Callback Debug Info ===');

  // 認証後は書籍検索画面にリダイレクト
  return NextResponse.redirect(finalRedirectUrl);
}
