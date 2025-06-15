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
          <h1 className="text-3xl font-bold">輪読会</h1>
          <p className="text-muted-foreground mt-1">みんなで本を読んで学びを深めよう</p>
        </div>
        <Button onClick={onCreateCircle} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* 次回予定イベント */}
      {nextEvent && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            次回予定
          </h2>
          <NextEventCard event={nextEvent} />
        </motion.section>
      )}

      {/* マイ輪読会 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          マイ輪読会
        </h2>

        {myCircles.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">まだ参加している輪読会がありません</h3>
              <p className="text-muted-foreground">
                新しい輪読会を作成するか、既存の輪読会に参加してみましょう
              </p>
            </div>
            <Button onClick={onCreateCircle} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              最初の輪読会を作成
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">すべて ({myCircles.length})</TabsTrigger>
              <TabsTrigger value="in-progress">進行中 ({inProgressCircles.length})</TabsTrigger>
              <TabsTrigger value="recruiting">募集中 ({recruitingCircles.length})</TabsTrigger>
              <TabsTrigger value="completed">完了済み ({completedCircles.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCircles.map((circle, index) => (
                  <MyReadingCircleCard key={circle.id} circle={circle} index={index} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressCircles.map((circle, index) => (
                  <MyReadingCircleCard key={circle.id} circle={circle} index={index} />
                ))}
              </div>
              {inProgressCircles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  進行中の輪読会はありません
                </div>
              )}
            </TabsContent>

            <TabsContent value="recruiting" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recruitingCircles.map((circle, index) => (
                  <MyReadingCircleCard key={circle.id} circle={circle} index={index} />
                ))}
              </div>
              {recruitingCircles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  募集中の輪読会はありません
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedCircles.map((circle, index) => (
                  <MyReadingCircleCard key={circle.id} circle={circle} index={index} />
                ))}
              </div>
              {completedCircles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  完了済みの輪読会はありません
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </motion.section>
    </div>
  );
}
