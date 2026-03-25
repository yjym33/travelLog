"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  X,
  Plus,
  Check,
  Calendar,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { TravelLog } from "@/types/travel";
import type { TravelStory, StoryTemplate } from "@/types/story";
import { storyTemplates } from "@/types/story";
import Image from "next/image";

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  travelLogs: TravelLog[];
  onCreateStory: (
    story: Omit<TravelStory, "id" | "createdAt" | "updatedAt">
  ) => void;
}

export default function StoryCreator({
  isOpen,
  onClose,
  travelLogs,
  onCreateStory,
}: StoryCreatorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [template, setTemplate] = useState<StoryTemplate>("timeline");
  const [isPublic, setIsPublic] = useState(false);

  const toggleLogSelection = (logId: string) => {
    setSelectedLogs((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId]
    );
  };

  const handleCreate = () => {
    if (!title.trim() || selectedLogs.length === 0) return;

    const selectedLogsData = travelLogs.filter((log) =>
      selectedLogs.includes(log.id)
    );
    const coverImage = selectedLogsData[0]?.photos[0] || null;

    onCreateStory({
      userId: "user1", // TODO: 실제 사용자 ID
      title: title.trim(),
      description: description.trim(),
      coverImage,
      travelLogIds: selectedLogs,
      template,
      isPublic,
    });

    // Reset
    setTitle("");
    setDescription("");
    setSelectedLogs([]);
    setTemplate("timeline");
    setIsPublic(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Card className="bg-slate-900 border-slate-700">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">
                      여행 스토리 만들기
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Story Info */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      스토리 제목
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="예: 2024년 유럽 여행"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      설명
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="이 여행 스토리에 대한 간단한 설명을 작성하세요"
                      rows={3}
                      className="bg-slate-800 border-slate-600 text-white resize-none"
                    />
                  </div>

                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      템플릿 선택
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(storyTemplates).map(([key, tmpl]) => (
                        <button
                          key={key}
                          onClick={() => setTemplate(key as StoryTemplate)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            template === key
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
                          }`}
                        >
                          <div className="text-3xl mb-2">{tmpl.icon}</div>
                          <div className="text-sm font-medium text-white">
                            {tmpl.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {tmpl.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Travel Log Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">
                        여행 기록 선택 ({selectedLogs.length}개 선택됨)
                      </label>
                      {selectedLogs.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLogs([])}
                          className="text-slate-400 hover:text-white"
                        >
                          모두 해제
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {travelLogs.map((log) => (
                        <button
                          key={log.id}
                          onClick={() => toggleLogSelection(log.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            selectedLogs.includes(log.id)
                              ? "border-purple-500 bg-purple-500/10"
                              : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {log.photos[0] && (
                              <Image
                                src={log.photos[0]}
                                alt={log.placeName}
                                width={60}
                                height={60}
                                className="rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h3 className="font-medium text-white truncate">
                                  {log.placeName}
                                </h3>
                                {selectedLogs.includes(log.id) && (
                                  <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                <MapPin className="w-3 h-3" />
                                {log.country}
                                <Calendar className="w-3 h-3 ml-2" />
                                {log.createdAt}
                              </div>
                              {log.photos.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                  <ImageIcon className="w-3 h-3" />
                                  {log.photos.length}개
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Public Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-white">
                        공개 스토리
                      </div>
                      <div className="text-xs text-slate-400">
                        다른 사용자가 이 스토리를 볼 수 있습니다
                      </div>
                    </div>
                    <Button
                      variant={isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPublic(!isPublic)}
                    >
                      {isPublic ? "공개" : "비공개"}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="text-slate-400 hover:text-white"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!title.trim() || selectedLogs.length === 0}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    스토리 만들기
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
