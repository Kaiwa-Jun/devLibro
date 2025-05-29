'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getUserBooks } from '@/lib/supabase/books';
import { Book } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface BookSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BookSelector({ value, onChange }: BookSelectorProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const userBooks = await getUserBooks(user.id);
        const booksList = userBooks.map(ub => ub.book).filter(Boolean);
        setBooks(booksList);
      } catch (error) {
        console.error('書籍取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [user]);

  const selectedBook = books.find(book => book.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {value && selectedBook
            ? selectedBook.title
            : isLoading
            ? '読み込み中...'
            : '書籍を選択してください'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="書籍を検索..." />
            <CommandEmpty>
              {books.length === 0 
                ? '本棚に書籍がありません。まずは本棚に書籍を追加してください。' 
                : '書籍が見つかりません'}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {books.map((book) => (
                <CommandItem
                  key={book.id}
                  value={book.title}
                  onSelect={() => {
                    onChange(book.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === book.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{book.title}</span>
                    <span className="text-xs text-muted-foreground">{book.author}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
