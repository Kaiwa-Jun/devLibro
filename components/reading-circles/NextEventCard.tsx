'use client';

import { motion } from 'framer-motion';
import { BookOpen, Calendar, Clock, Users } from 'lucide-react';
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
        <Card className="hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              >
                <Calendar className="h-3 w-3 mr-1" />
                次回予定
              </Badge>
              <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                <Clock className="h-4 w-4" />
                {event.time}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左カラム: 書籍情報 */}
              <div className="flex gap-4">
                <div className="relative h-20 w-14 flex-shrink-0">
                  <Image
                    src={event.bookCover}
                    alt={event.bookTitle}
                    fill
                    className="object-cover rounded-xl shadow-lg"
                    sizes="56px"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-bold text-lg line-clamp-2 text-gray-900 dark:text-white">
                    {event.title}
                  </h3>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-1">
                    {event.bookTitle}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-lg">
                        <Calendar className="h-3 w-3" />
                      </div>
                      <span className="font-medium">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-lg">
                        <Users className="h-3 w-3" />
                      </div>
                      <span className="font-medium">
                        {event.participants}/{event.maxParticipants}名
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右カラム: プログレスバー */}
              <div className="flex flex-col justify-center space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-1 rounded-lg">
                      <BookOpen className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="font-medium">読書進捗</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {event.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${event.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
