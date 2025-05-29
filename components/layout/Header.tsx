'use client';

import { motion } from 'framer-motion';
import { BookOpen, Home, Moon, Sun, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

import AuthButton from '../auth/AuthButton';
import { Button } from '../ui/button';

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const tabs = [
    {
      name: 'ホーム',
      href: '/books',
      icon: Home,
      active: pathname === '/books' || pathname === '/',
    },
    {
      name: '本棚',
      href: '/profile',
      icon: User,
      active: pathname.startsWith('/profile'),
    },
    {
      name: '輪読会',
      href: '/reading-circles',
      icon: Users,
      active: pathname.startsWith('/reading-circles'),
    },
    // 元のGoogle Books APIを使った検索画面はコメントアウト
    // {
    //   name: 'Google検索',
    //   href: '/google-search',
    //   icon: Search,
    //   active: pathname === '/google-search',
    // },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/books" className="flex items-center space-x-2">
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
                  tab.active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground md:hover:bg-muted'
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
            className="rounded-lg md:hover:bg-muted md:hover:text-foreground"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">テーマを切り替え</span>
          </Button>

          <AuthButton />
        </div>
      </div>
    </header>
  );
}
