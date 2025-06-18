'use client';

import { motion } from 'framer-motion';
import { BookOpen, Home, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

export default function TabBar() {
  const pathname = usePathname();

  // デバッグ用ログ
  console.log('TabBar - pathname:', pathname);

  const tabs = [
    {
      name: 'ホーム',
      href: '/',
      icon: Home,
      active: pathname === '/' || pathname === '/books',
    },
    {
      name: '輪読会',
      href: '/reading-circles',
      icon: Users,
      active: pathname.startsWith('/reading-circles'),
    },
    {
      name: '本棚',
      href: '/profile',
      icon: BookOpen,
      active: pathname.startsWith('/profile'),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {tabs.map(tab => {
            // デバッグ用ログ
            const animationKey =
              tab.name === '本棚' && tab.active ? 'bookshelf-active' : 'bookshelf-inactive';
            console.log(
              `Tab: ${tab.name}, active: ${tab.active}, shouldAnimate: ${tab.name === '本棚' && tab.active}, key: ${animationKey}`
            );

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full',
                  tab.active ? 'text-primary' : 'text-gray-500'
                )}
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    key={animationKey}
                    initial={{ rotate: 0 }}
                    animate={
                      tab.name === '本棚' && tab.active ? { rotate: [0, 20, 0] } : { rotate: 0 }
                    }
                    transition={{
                      duration: 0.5,
                      ease: 'easeInOut',
                      times: [0, 0.5, 1],
                    }}
                    onAnimationStart={() => console.log('Animation started for:', tab.name)}
                    onAnimationComplete={() => console.log('Animation completed for:', tab.name)}
                  >
                    <tab.icon className="h-6 w-6" />
                  </motion.div>
                  <span className="text-xs mt-1">{tab.name}</span>
                </div>
                {tab.active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 h-1 w-16 bg-primary rounded-t-md"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
