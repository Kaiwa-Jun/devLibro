"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const experienceOptions = [
  { value: "0", label: "未経験" },
  { value: "1", label: "1年未満" },
  { value: "2", label: "1〜3年" },
  { value: "3", label: "3〜5年" },
  { value: "4", label: "5年以上" },
];

const getExperienceLabel = (value: string) => {
  return (
    experienceOptions.find((option) => option.value === value)?.label ||
    "未設定"
  );
};

const getExperienceValue = (years: number) => {
  if (years === 0) return "0";
  if (years < 1) return "1";
  if (years < 3) return "2";
  if (years < 5) return "3";
  return "4";
};

export default function UserInfo() {
  const [userName, setUserName] = useState("テックリーダー");
  const [experienceYears, setExperienceYears] = useState(5);
  const [editMode, setEditMode] = useState(false);

  const [editedName, setEditedName] = useState(userName);
  const [editedExperience, setEditedExperience] = useState(
    getExperienceValue(experienceYears)
  );

  const handleSave = () => {
    setUserName(editedName);
    // 経験年数の値を数値に変換
    const yearsMap: Record<string, number> = {
      "0": 0,
      "1": 0.5,
      "2": 2,
      "3": 4,
      "4": 5,
    };
    setExperienceYears(yearsMap[editedExperience]);
    setEditMode(false);
  };

  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Avatar className="h-16 w-16">
        <AvatarFallback className="bg-primary/10">
          <LucideIcons.User className="h-7 w-7 text-primary" />
        </AvatarFallback>
      </Avatar>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{userName}</h2>
          <Dialog open={editMode} onOpenChange={setEditMode}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LucideIcons.Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>プロフィール編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">ユーザー名</Label>
                  <Input
                    id="username"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">経験年数</Label>
                  <Select
                    value={editedExperience}
                    onValueChange={setEditedExperience}
                  >
                    <SelectTrigger id="experience" className="w-full">
                      <SelectValue placeholder="経験年数を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">キャンセル</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleSave}>保存</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Badge variant="outline" className="mt-1 border">
          経験 {getExperienceLabel(getExperienceValue(experienceYears))}
        </Badge>
      </div>
    </motion.div>
  );
}
