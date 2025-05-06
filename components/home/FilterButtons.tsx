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
    // プログラミング言語
    {
      value: 'JavaScript',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      type: 'language',
    },
    {
      value: 'TypeScript',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
      type: 'language',
    },
    {
      value: 'Python',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      type: 'language',
    },
    {
      value: 'Java',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
      type: 'language',
    },
    {
      value: 'Go',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
      type: 'language',
    },
    {
      value: 'Rust',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
      type: 'language',
    },
    {
      value: 'PHP',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
      type: 'language',
    },
    {
      value: 'Ruby',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
      type: 'language',
    },
    {
      value: 'C',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
      type: 'language',
    },
    {
      value: 'C++',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
      type: 'language',
    },
    {
      value: 'C#',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
      type: 'language',
    },
    {
      value: 'Swift',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
      type: 'language',
    },
    {
      value: 'Kotlin',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
      type: 'language',
    },
    {
      value: 'Scala',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scala/scala-original.svg',
      type: 'language',
    },
    {
      value: 'R',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg',
      type: 'language',
    },
    {
      value: 'Dart',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg',
      type: 'language',
    },
    {
      value: 'HTML/CSS',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
      type: 'language',
    },
    {
      value: 'Shell',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
      type: 'language',
    },
    // フレームワーク
    {
      value: 'React',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      type: 'framework',
    },
    {
      value: 'Next.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
      type: 'framework',
    },
    {
      value: 'Vue.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
      type: 'framework',
    },
    {
      value: 'Nuxt.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nuxtjs/nuxtjs-original.svg',
      type: 'framework',
    },
    {
      value: 'Angular',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
      type: 'framework',
    },
    {
      value: 'Svelte',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',
      type: 'framework',
    },
    {
      value: 'Express',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
      type: 'framework',
    },
    {
      value: 'Django',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
      type: 'framework',
    },
    {
      value: 'Flask',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg',
      type: 'framework',
    },
    {
      value: 'Spring Boot',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
      type: 'framework',
    },
    {
      value: 'Ruby on Rails',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rails/rails-original-wordmark.svg',
      type: 'framework',
    },
    {
      value: 'Laravel',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg',
      type: 'framework',
    },
    {
      value: 'ASP.NET',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dot-net/dot-net-original.svg',
      type: 'framework',
    },
    {
      value: 'Flutter',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
      type: 'framework',
    },
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
  const {
    difficulty,
    language,
    category,
    framework = [],
    addFilter,
    removeFilter,
    clearFilters,
  } = useFilterStore();

  // 全フィルター数を計算
  const filterCount = difficulty.length + language.length + category.length + framework.length;

  const handleFilterSelect = (filterType: FilterCategory, option: string, optionType?: string) => {
    // 引数名を変更して衝突を避ける（変数名と引数名の衝突防止）

    // 言語またはフレームワークとして処理
    if (filterType === 'language' && optionType === 'framework') {
      const isSelected = framework.some(fw => fw.toLowerCase() === option.toLowerCase());
      if (isSelected) {
        const exactItem = framework.find(fw => fw.toLowerCase() === option.toLowerCase());
        if (exactItem) {
          removeFilter('framework', exactItem);
        }
      } else {
        addFilter('framework', option);
      }
      return;
    }

    // 選択したオプションを大文字小文字を区別せずに検索
    if (filterType === 'difficulty') {
      if (difficulty.includes(option)) {
        removeFilter('difficulty', option);
      } else {
        addFilter('difficulty', option);
      }
    } else if (filterType === 'language') {
      // 大文字小文字を区別せずに比較する（lower caseに正規化して比較）
      const isSelected = language.some(lang => lang.toLowerCase() === option.toLowerCase());
      if (isSelected) {
        // 完全一致のアイテムを探して削除
        const exactItem = language.find(lang => lang.toLowerCase() === option.toLowerCase());
        if (exactItem) {
          removeFilter('language', exactItem);
        }
      } else {
        addFilter('language', option);
      }
    } else if (filterType === 'category') {
      if (category.includes(option)) {
        removeFilter('category', option);
      } else {
        addFilter('category', option);
      }
    }
  };

  // 言語またはフレームワークかどうかをチェック
  const isSelectedLanguageOrFramework = (value: string, type?: string) => {
    if (type === 'framework') {
      return framework.some(fw => fw.toLowerCase() === value.toLowerCase());
    }
    return language.some(lang => lang.toLowerCase() === value.toLowerCase());
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4 overflow-y-auto pb-24 max-h-[calc(70vh-160px)]">
              {filterOptions.difficulty.map(diff => {
                const Icon = diff.icon;
                return (
                  <Button
                    key={diff.value}
                    variant={difficulty.includes(diff.value) ? 'default' : 'outline'}
                    className={cn(
                      'flex-col justify-center items-center h-auto py-4 px-2 hover:bg-primary/5',
                      difficulty.includes(diff.value) && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => handleFilterSelect('difficulty', diff.value)}
                  >
                    <Icon className="h-5 w-5 mb-2" style={{ color: `var(--${diff.color})` }} />
                    <span className="text-center text-sm">{diff.label}</span>
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
              言語・フレームワーク
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>言語・フレームワーク</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto max-h-[calc(70vh-160px)] pr-1 pb-24">
              <h3 className="text-sm font-medium mb-2">プログラミング言語</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">
                {filterOptions.language
                  .filter(item => item.type === 'language')
                  .map(lang => (
                    <Button
                      key={lang.value}
                      variant={
                        isSelectedLanguageOrFramework(lang.value, lang.type) ? 'default' : 'outline'
                      }
                      className={cn(
                        'flex-col justify-center items-center h-auto py-4 px-2 hover:bg-primary/5',
                        isSelectedLanguageOrFramework(lang.value, lang.type) &&
                          'bg-primary text-primary-foreground'
                      )}
                      onClick={() => handleFilterSelect('language', lang.value, lang.type)}
                    >
                      <div className="relative w-8 h-8 mb-2">
                        <Image
                          src={lang.icon}
                          alt={lang.value}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-center text-sm">{lang.value}</span>
                    </Button>
                  ))}
              </div>

              <h3 className="text-sm font-medium mb-2">フレームワーク</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filterOptions.language
                  .filter(item => item.type === 'framework')
                  .map(fw => (
                    <Button
                      key={fw.value}
                      variant={
                        isSelectedLanguageOrFramework(fw.value, fw.type) ? 'default' : 'outline'
                      }
                      className={cn(
                        'flex-col justify-center items-center h-auto py-4 px-2 hover:bg-primary/5',
                        isSelectedLanguageOrFramework(fw.value, fw.type) &&
                          'bg-primary text-primary-foreground'
                      )}
                      onClick={() => handleFilterSelect('language', fw.value, fw.type)}
                    >
                      <div className="relative w-8 h-8 mb-2">
                        <Image
                          src={fw.icon}
                          alt={fw.value}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-center text-sm">{fw.value}</span>
                    </Button>
                  ))}
              </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4 overflow-y-auto pb-24 max-h-[calc(70vh-160px)]">
              {filterOptions.category.map(cat => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.value}
                    variant={category.includes(cat.value) ? 'default' : 'outline'}
                    className={cn(
                      'flex-col justify-center items-center h-auto py-4 px-2 hover:bg-primary/5',
                      category.includes(cat.value) && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => handleFilterSelect('category', cat.value)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-center text-sm">{cat.value}</span>
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
                <Icon className="h-5 w-5" style={{ color: `var(--${diffOption.color})` }} />
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
            const langOption = filterOptions.language.find(
              lang => lang.value.toLowerCase() === value.toLowerCase()
            );
            if (!langOption) return null;

            return (
              <motion.div
                key={value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2"
              >
                <div className="relative w-5 h-5 flex-shrink-0">
                  <Image
                    src={langOption.icon}
                    alt={value}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span>{value}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterSelect('language', value, langOption.type)}
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
                <Icon className="h-5 w-5" />
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

      {framework.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {framework.map(value => {
            const fwOption = filterOptions.language.find(
              fw => fw.type === 'framework' && fw.value.toLowerCase() === value.toLowerCase()
            );
            if (!fwOption) return null;

            return (
              <motion.div
                key={value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2"
              >
                <div className="relative w-5 h-5 flex-shrink-0">
                  <Image
                    src={fwOption.icon}
                    alt={value}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span>{value}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterSelect('language', value, 'framework')}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
