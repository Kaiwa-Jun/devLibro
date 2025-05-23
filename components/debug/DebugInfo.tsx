'use client';

import { useEffect, useState } from 'react';

export default function DebugInfo() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // 開発環境でのみ表示
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-md z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>NODE_ENV: {process.env.NODE_ENV}</div>
        <div>NEXT_PUBLIC_VERCEL_URL: {process.env.NEXT_PUBLIC_VERCEL_URL || 'undefined'}</div>
        <div>Location Origin: {window.location.origin}</div>
        <div>Location Href: {window.location.href}</div>
        <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
      </div>
    </div>
  );
}
