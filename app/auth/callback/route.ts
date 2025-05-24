import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// OAuth認証後のリダイレクト処理
export async function GET(request: NextRequest) {
  // eslint-disable-next-line no-console
  console.log('=== Auth Callback Debug Info ===');

  const requestUrl = new URL(request.url);
  // eslint-disable-next-line no-console
  console.log('Request URL:', requestUrl.toString());
  // eslint-disable-next-line no-console
  console.log('Request origin:', requestUrl.origin);
  // eslint-disable-next-line no-console
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // eslint-disable-next-line no-console
  console.log('OAuth params:', {
    hasCode: !!code,
    error,
    errorDescription,
    allParams: Object.fromEntries(requestUrl.searchParams.entries()),
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('OAuth error:', { error, errorDescription });
    // エラーがある場合は適切なエラーページにリダイレクト
    const errorRedirectUrl = `${requestUrl.origin}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`;
    // eslint-disable-next-line no-console
    console.log('Redirecting to error page:', errorRedirectUrl);
    return NextResponse.redirect(errorRedirectUrl);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      // OAuthセッションを確立
      const result = await supabase.auth.exchangeCodeForSession(code);
      // eslint-disable-next-line no-console
      console.log('Session exchange result:', {
        session: !!result.data?.session,
        user: !!result.data?.user,
        userId: result.data?.user?.id,
        email: result.data?.user?.email,
        error: result.error?.message,
        errorDetails: result.error,
      });

      if (result.error) {
        // eslint-disable-next-line no-console
        console.error('Session exchange failed:', result.error);
        // セッション確立に失敗した場合はログインページにリダイレクト
        const errorRedirectUrl = `${requestUrl.origin}/login?error=session_failed&error_description=${encodeURIComponent(result.error.message)}`;
        return NextResponse.redirect(errorRedirectUrl);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Session exchange error:', error);
      const errorRedirectUrl = `${requestUrl.origin}/login?error=session_error&error_description=${encodeURIComponent(String(error))}`;
      return NextResponse.redirect(errorRedirectUrl);
    }
  }

  // 適切なリダイレクト先URLを決定
  // eslint-disable-next-line no-console
  console.log('Environment variables:');
  // eslint-disable-next-line no-console
  console.log('NODE_ENV:', process.env.NODE_ENV);
  // eslint-disable-next-line no-console
  console.log('VERCEL_URL:', process.env.VERCEL_URL);
  // eslint-disable-next-line no-console
  console.log('NEXT_PUBLIC_VERCEL_URL:', process.env.NEXT_PUBLIC_VERCEL_URL);

  // 本番環境では現在のoriginを使用（VERCEL_URLは使わない）
  const baseUrl = requestUrl.origin;
  // eslint-disable-next-line no-console
  console.log('Base URL determined:', baseUrl);

  const finalRedirectUrl = `${baseUrl}/books`;
  // eslint-disable-next-line no-console
  console.log('Final redirect URL:', finalRedirectUrl);
  // eslint-disable-next-line no-console
  console.log('=== End Auth Callback Debug Info ===');

  // 認証後は書籍検索画面にリダイレクト
  return NextResponse.redirect(finalRedirectUrl);
}
