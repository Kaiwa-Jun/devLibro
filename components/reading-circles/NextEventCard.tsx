'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface NextEventCardProps {
  event: {
    id: string;
    title: string;
    bookTitle: string;
    bookCover: string;
    date: string;
    time: string;
    participants: number;
    maxParticipants: number;
    progress: number;
  };
}

export default function NextEventCard({ event }: NextEventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Link href={`/reading-circles/${event.id}`}>
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Calendar className="h-3 w-3 mr-1" />
                次回予定
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {event.time}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {/* 書籍画像 */}
              <div className="relative h-20 w-14 flex-shrink-0">
                <Image
                  src={event.bookCover}
                  alt={event.bookTitle}
                  fill
                  className="object-cover rounded-md shadow-sm"
                  sizes="56px"
                />
              </div>

              {/* イベント情報 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg line-clamp-2 mb-1">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{event.bookTitle}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {event.participants}/{event.maxParticipants}名
                  </div>
                </div>
              </div>
            </div>

            {/* プログレスバー */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  読書進捗
                </div>
                <span className="font-medium">{event.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${event.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
