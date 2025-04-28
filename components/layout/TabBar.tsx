'use client';

import { motion } from 'framer-motion';
import { Home, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

export default function TabBar() {
  const pathname = usePathname();

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {tabs.map(tab => (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full',
                tab.active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                <tab.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{tab.name}</span>
              </motion.div>
              {tab.active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 h-1 w-16 bg-primary rounded-t-md"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
