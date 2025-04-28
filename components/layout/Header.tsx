'use client';

import { motion } from 'framer-motion';
import { BookOpen, Home, User, LogIn, Moon, Sun } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

const AuthDialog = dynamic(() => import('@/components/auth/AuthDialog'), {
  ssr: false,
});

export default function Header() {
  const pathname = usePathname();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const tabs = [
    {
      name: 'ホーム',
      href: '/',
      icon: Home,
      active: pathname === '/',
    },
    {
      name: '本棚',
      href: '/profile',
      icon: User,
      active: pathname.startsWith('/profile'),
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <motion.div whileHover={{ rotate: 10 }} transition={{ type: 'spring', stiffness: 300 }}>
              <BookOpen className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="text-xl font-semibold tracking-tight">DevLibro</h1>
          </Link>

          <nav className="hidden md:flex ml-8 space-x-1">
            {tabs.map(tab => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  tab.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{tab.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">テーマを切り替え</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-11 px-4 rounded-lg"
            onClick={() => setIsAuthOpen(true)}
          >
            <LogIn className="h-4 w-4" />
            新規登録/ログイン
          </Button>
        </div>

        <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </header>
  );
}
