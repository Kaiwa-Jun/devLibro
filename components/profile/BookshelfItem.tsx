"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserBook } from "@/types";
import { formatDate } from "@/lib/utils";

type BookshelfItemProps = {
  userBook: UserBook;
};

export default function BookshelfItem({ userBook }: BookshelfItemProps) {
  const [progress, setProgress] = useState(userBook.progress || 0);

  const getStatusIcon = () => {
    switch (userBook.status) {
      case "unread":
        return <LucideIcons.Clock className="h-4 w-4" />;
      case "reading":
        return <LucideIcons.BookOpen className="h-4 w-4" />;
      case "done":
        return <LucideIcons.Check className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (userBook.status) {
      case "unread":
        return "未読";
      case "reading":
        return "読書中";
      case "done":
        return "読了";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Link href={`/book/${userBook.book.id}`} className="flex-shrink-0">
              <div className="relative h-20 w-16">
                <Image
                  src={userBook.book.img_url}
                  alt={userBook.book.title}
                  fill
                  className="object-cover rounded-sm"
                  sizes="64px"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/book/${userBook.book.id}`}>
                  <h3 className="font-medium line-clamp-1 hover:text-primary transition-colors">
                    {userBook.book.title}
                  </h3>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <LucideIcons.MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>未読に設定</DropdownMenuItem>
                    <DropdownMenuItem>読書中に設定</DropdownMenuItem>
                    <DropdownMenuItem>読了に設定</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      本棚から削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-1">
                {userBook.book.author}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </Badge>

                {userBook.added_at && (
                  <span className="text-xs text-muted-foreground">
                    追加: {formatDate(userBook.added_at)}
                  </span>
                )}
              </div>

              {userBook.status === "reading" && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>進捗</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
