'use client';

import { motion } from 'framer-motion';
import { BookOpen, Calendar, Plus, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import MyReadingCircleCard from './MyReadingCircleCard';
import NextEventCard from './NextEventCard';
import { ReadingCircleStatus } from './ReadingCircleStatusBadge';

interface ReadingCircle {
  id: string;
  title: string;
  bookTitle: string;
  bookCover: string;
  participants: number;
  maxParticipants: number;
  progress: number;
  status: ReadingCircleStatus;
  nextMeetingDate?: string;
  description: string;
  scheduleCandidates?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

interface NextEvent {
  id: string;
  title: string;
  bookTitle: string;
  bookCover: string;
  date: string;
  time: string;
  participants: number;
  maxParticipants: number;
  progress: number;
}

interface ReadingCirclesHomeProps {
  nextEvent?: NextEvent;
  myCircles: ReadingCircle[];
  onCreateCircle: () => void;
}

export default function ReadingCirclesHome({
  nextEvent,
  myCircles,
  onCreateCircle,
}: ReadingCirclesHomeProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filterCirclesByStatus = (status?: ReadingCircleStatus) => {
    if (!status) return myCircles;
    return myCircles.filter(circle => circle.status === status);
  };

  const inProgressCircles = filterCirclesByStatus('in-progress');
  const recruitingCircles = filterCirclesByStatus('recruiting');
  const completedCircles = filterCirclesByStatus('completed');

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            輪読会
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">みんなで本を読んで学びを深めよう ✨</p>
        </div>
        <Button
          onClick={onCreateCircle}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          新規作成
        </Button>
      </div>

      {/* 次回予定イベント */}
      {nextEvent && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">次回予定 🎯</h2>
          </div>
          <NextEventCard event={nextEvent} />
        </motion.section>
      )}

      {/* マイ輪読会 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-2 rounded-xl">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">マイ輪読会 📚</h2>
        </div>

        {myCircles.length === 0 ? (
          <div className="text-center py-16 space-y-6">
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center shadow-lg">
              <Users className="h-16 w-16 text-gray-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                まだ参加している輪読会がありません
              </h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                新しい輪読会を作成するか、既存の輪読会に参加してみましょう 🚀
              </p>
            </div>
            <Button
              onClick={onCreateCircle}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              最初の輪読会を作成
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium rounded-lg transition-all duration-200"
              >
                すべて ({myCircles.length})
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 font-medium rounded-lg transition-all duration-200"
              >
                進行中 ({inProgressCircles.length})
              </TabsTrigger>
              <TabsTrigger
                value="recruiting"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 font-medium rounded-lg transition-all duration-200"
              >
                募集中 ({recruitingCircles.length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-600 font-medium rounded-lg transition-all duration-200"
              >
                完了済み ({completedCircles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCircles.map((circle, index) => (
                  <MyReadingCircleCard key={circle.id} circle={circle} index={index} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressCircles.map((circle, index) => (
                  <MyReadingCircleCard key={circle.id} circle={circle} index={index} />
                ))}
              </div>
              {inProgressCircles.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="text-6xl">📖</div>
                  <p className="text-muted-foreground text-lg">進行中の輪読会はありません</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recruiting" className="space-y-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recruitingCircles.map((circle, index) => (
                  <MyReadingCircleCard key={circle.id} circle={circle} index={index} />
                ))}
              </div>
              {recruitingCircles.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="text-6xl">🔍</div>
                  <p className="text-muted-foreground text-lg">募集中の輪読会はありません</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCircles.map((circle, index) => (
                  <MyReadingCircleCard key={circle.id} circle={circle} index={index} />
                ))}
              </div>
              {completedCircles.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="text-6xl">🎉</div>
                  <p className="text-muted-foreground text-lg">完了済みの輪読会はありません</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </motion.section>
    </div>
  );
}
