'use client';

import { motion } from 'framer-motion';
import { Brain, Cloud, Code2, Cog, Database, Server, Shield, Smartphone, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn, getDifficultyInfo } from '@/lib/utils';
import { useFilterStore } from '@/store/filterStore';

type FilterCategory = 'difficulty' | 'language' | 'category';

const filterOptions = {
  difficulty: [1, 2, 3, 4, 5].map(level => {
    const info = getDifficultyInfo(level);
    return {
      value: level.toString(),
      label: info.label,
      icon: info.icon,
      color: info.color,
    };
  }),
  language: [
    { value: 'JavaScript', icon: '/icons/javascript.svg' },
    { value: 'TypeScript', icon: '/icons/typescript.svg' },
    { value: 'Python', icon: '/icons/python.svg' },
    { value: 'Java', icon: '/icons/java.svg' },
    { value: 'Go', icon: '/icons/go.svg' },
    { value: 'Rust', icon: '/icons/rust.svg' },
    { value: 'PHP', icon: '/icons/php.svg' },
    { value: 'Ruby', icon: '/icons/ruby.svg' },
  ],
  category: [
    { value: 'フロントエンド', icon: Code2 },
    { value: 'バックエンド', icon: Server },
    { value: 'モバイル', icon: Smartphone },
    { value: 'インフラ', icon: Cloud },
    { value: 'データベース', icon: Database },
    { value: 'セキュリティ', icon: Shield },
    { value: 'AI/ML', icon: Brain },
    { value: 'DevOps', icon: Cog },
  ],
};

export default function FilterButtons() {
  const [activeSheet, setActiveSheet] = useState<FilterCategory | null>(null);

  // フィルターストアから状態とアクションを取得
  const { difficulty, language, category, addFilter, removeFilter, clearFilters } =
    useFilterStore();

  // 全フィルター数を計算
  const filterCount = difficulty.length + language.length + category.length;

  const handleFilterSelect = (category: FilterCategory, option: string) => {
    if (category === 'difficulty') {
      if (difficulty.includes(option)) {
        removeFilter('difficulty', option);
      } else {
        addFilter('difficulty', option);
      }
    } else if (category === 'language') {
      if (language.includes(option)) {
        removeFilter('language', option);
      } else {
        addFilter('language', option);
      }
    } else if (category === 'category') {
      if (category.includes(option)) {
        removeFilter('category', option);
      } else {
        addFilter('category', option);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        <Sheet
          open={activeSheet === 'difficulty'}
          onOpenChange={open => setActiveSheet(open ? 'difficulty' : null)}
        >
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-full flex-shrink-0">
              難易度
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>難易度</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
              {filterOptions.difficulty.map(diff => {
                const Icon = diff.icon;
                return (
                  <Button
                    key={diff.value}
                    variant={difficulty.includes(diff.value) ? 'default' : 'outline'}
                    className={cn(
                      'justify-start text-left font-normal h-auto py-3',
                      difficulty.includes(diff.value) && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => handleFilterSelect('difficulty', diff.value)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className="h-5 w-5 flex-shrink-0"
                        style={{ color: `var(--${diff.color})` }}
                      />
                      <span>{diff.label}</span>
                    </div>
                  </Button>
                );
              })}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button className="w-full" onClick={() => setActiveSheet(null)}>
                適用する
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet
          open={activeSheet === 'language'}
          onOpenChange={open => setActiveSheet(open ? 'language' : null)}
        >
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-full flex-shrink-0">
              言語
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>プログラミング言語</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
              {filterOptions.language.map(lang => (
                <Button
                  key={lang.value}
                  variant={language.includes(lang.value) ? 'default' : 'outline'}
                  className={cn(
                    'justify-start text-left font-normal h-auto py-3',
                    language.includes(lang.value) && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => handleFilterSelect('language', lang.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image src={lang.icon} alt={lang.value} fill className="object-contain" />
                    </div>
                    <span>{lang.value}</span>
                  </div>
                </Button>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button className="w-full" onClick={() => setActiveSheet(null)}>
                適用する
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet
          open={activeSheet === 'category'}
          onOpenChange={open => setActiveSheet(open ? 'category' : null)}
        >
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-full flex-shrink-0">
              カテゴリ
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>カテゴリ</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
              {filterOptions.category.map(cat => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.value}
                    variant={category.includes(cat.value) ? 'default' : 'outline'}
                    className={cn(
                      'justify-start text-left font-normal h-auto py-3',
                      category.includes(cat.value) && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => handleFilterSelect('category', cat.value)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{cat.value}</span>
                    </div>
                  </Button>
                );
              })}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button className="w-full" onClick={() => setActiveSheet(null)}>
                適用する
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {filterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full flex-shrink-0 flex items-center space-x-1"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
            <span>クリア ({filterCount})</span>
          </Button>
        )}
      </div>

      {/* 選択されたフィルターを表示 */}
      {difficulty.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {difficulty.map(value => {
            const diffOption = filterOptions.difficulty.find(diff => diff.value === value);
            if (!diffOption) return null;
            const Icon = diffOption.icon;

            return (
              <motion.div
                key={value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2"
              >
                <Icon className="h-4 w-4" style={{ color: `var(--${diffOption.color})` }} />
                <span>{diffOption.label}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterSelect('difficulty', value)}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {language.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {language.map(value => {
            const langOption = filterOptions.language.find(lang => lang.value === value);
            if (!langOption) return null;

            return (
              <motion.div
                key={value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2"
              >
                <div className="relative w-4 h-4">
                  <Image src={langOption.icon} alt={value} fill className="object-contain" />
                </div>
                <span>{value}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterSelect('language', value)}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {category.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {category.map(value => {
            const catOption = filterOptions.category.find(cat => cat.value === value);
            if (!catOption) return null;
            const Icon = catOption.icon;

            return (
              <motion.div
                key={value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{value}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterSelect('category', value)}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
