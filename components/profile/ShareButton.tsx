"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ShareButton() {
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState("month");
  const [open, setOpen] = useState(false);

  const handleShare = () => {
    toast.success("共有リンクがコピーされました");
    setOpen(false);
    setStep(1);
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button variant="outline" size="sm" className="gap-2">
            <LucideIcons.Share2 className="h-4 w-4" />
            <span>SNS共有</span>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>読書記録を共有</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>期間を選択</CardTitle>
                <CardDescription>
                  共有する読書データの期間を選択してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={period} onValueChange={setPeriod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="week" />
                    <Label htmlFor="week">直近1週間</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="month" />
                    <Label htmlFor="month">直近1ヶ月</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="year" id="year" />
                    <Label htmlFor="year">直近1年</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">すべて</Label>
                  </div>
                </RadioGroup>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleNext}>次へ</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>共有プレビュー</CardTitle>
                <CardDescription>
                  {period === "week" && "直近1週間"}
                  {period === "month" && "直近1ヶ月"}
                  {period === "year" && "直近1年"}
                  {period === "all" && "すべての期間"}
                  の読書データを共有します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 bg-muted/50 mb-4">
                  <p className="font-medium">私の読書記録をシェアします！</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    読んだ本: 5冊 / 総ページ数: 1,250 / 学習時間: 42時間
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="share-url">共有URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="share-url"
                      value="https://devlibro.example.com/share/u123abc"
                      readOnly
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          "https://devlibro.example.com/share/u123abc"
                        );
                        toast.success("URLをコピーしました");
                      }}
                    >
                      コピー
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={handleBack}>
                    戻る
                  </Button>
                  <Button onClick={handleShare}>共有する</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
