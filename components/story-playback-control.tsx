"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Gauge,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StoryPlaybackControlProps {
  isPlaying: boolean;
  currentIndex: number;
  totalStops: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSpeedChange: (speed: number) => void;
  onProgressChange: (index: number) => void;
  onClose: () => void;
  placeName: string;
  currentDate: string;
}

export default function StoryPlaybackControl({
  isPlaying,
  currentIndex,
  totalStops,
  speed,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSpeedChange,
  onProgressChange,
  onClose,
  placeName,
  currentDate,
}: StoryPlaybackControlProps) {
  const progress = totalStops > 0 ? (currentIndex / totalStops) * 100 : 0;

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25 }}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">여행 스토리 재생</h3>
                <p className="text-xs text-slate-400">
                  {currentIndex + 1} / {totalStops} · {placeName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3">
          <div className="relative">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {/* Timeline markers */}
            <div className="absolute inset-0 flex justify-between px-1">
              {Array.from({ length: totalStops }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => onProgressChange(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-white scale-125 shadow-lg"
                      : index < currentIndex
                      ? "bg-purple-400"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                  style={{ marginTop: "-2px" }}
                  title={`여행지 ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{currentDate}</span>
            <span>{Math.round(progress)}% 완료</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="text-slate-300 hover:text-white disabled:opacity-30"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              size="icon"
              onClick={isPlaying ? onPause : onPlay}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={currentIndex >= totalStops - 1}
              className="text-slate-300 hover:text-white disabled:opacity-30"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Gauge className="w-4 h-4" />
              <span className="text-xs">속도</span>
            </div>
            <Select
              value={speed.toString()}
              onValueChange={(value) => onSpeedChange(Number(value))}
            >
              <SelectTrigger className="w-24 h-9 bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="0.5" className="text-white">
                  0.5x
                </SelectItem>
                <SelectItem value="1" className="text-white">
                  1x
                </SelectItem>
                <SelectItem value="1.5" className="text-white">
                  1.5x
                </SelectItem>
                <SelectItem value="2" className="text-white">
                  2x
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tips */}
        <div className="px-6 py-3 bg-slate-800/50 rounded-b-2xl">
          <p className="text-xs text-slate-400 text-center">
            💡 타임라인 점을 클릭하여 원하는 여행지로 바로 이동하세요
          </p>
        </div>
      </div>
    </motion.div>
  );
}
