"use client";

import type React from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Film } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TravelLog, Emotion } from "@/types/travel";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import StoryPlaybackControl from "./story-playback-control";
import StoryPreviewCard from "./story-preview-card";

const MapComponent = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-slate-800 rounded-lg flex items-center justify-center">
      <div className="text-slate-400">지도를 불러오는 중...</div>
    </div>
  ),
});

interface WorldMapProps {
  travelLogs: TravelLog[];
  onPinClick: (log: TravelLog) => void;
  onAddPin: (lat: number, lng: number) => void;
  emotions: Record<string, Emotion>;
}

export default function WorldMap({
  travelLogs,
  onPinClick,
  onAddPin,
  emotions,
}: WorldMapProps) {
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Story Mode States
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [focusedLocation, setFocusedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sort travel logs by date for story mode
  const sortedLogs = [...travelLogs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Story mode functions
  const startStoryMode = useCallback(() => {
    if (sortedLogs.length === 0) return;
    setIsStoryMode(true);
    setCurrentStoryIndex(0);
    setIsPlaying(true);
    setFocusedLocation({
      lat: sortedLogs[0].lat,
      lng: sortedLogs[0].lng,
    });
  }, [sortedLogs]);

  const stopStoryMode = useCallback(() => {
    setIsStoryMode(false);
    setIsPlaying(false);
    setCurrentStoryIndex(0);
    setFocusedLocation(null);
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < sortedLogs.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setFocusedLocation({
        lat: sortedLogs[nextIndex].lat,
        lng: sortedLogs[nextIndex].lng,
      });
    }
  }, [currentStoryIndex, sortedLogs]);

  const handlePrevious = useCallback(() => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      setFocusedLocation({
        lat: sortedLogs[prevIndex].lat,
        lng: sortedLogs[prevIndex].lng,
      });
    }
  }, [currentStoryIndex, sortedLogs]);

  const handleProgressChange = useCallback(
    (index: number) => {
      setCurrentStoryIndex(index);
      setFocusedLocation({
        lat: sortedLogs[index].lat,
        lng: sortedLogs[index].lng,
      });
    },
    [sortedLogs]
  );

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && isStoryMode) {
      const duration = 3000 / playbackSpeed; // 3 seconds per stop, adjusted by speed

      playbackTimerRef.current = setTimeout(() => {
        if (currentStoryIndex < sortedLogs.length - 1) {
          handleNext();
        } else {
          // End of story
          setIsPlaying(false);
        }
      }, duration);

      return () => {
        if (playbackTimerRef.current) {
          clearTimeout(playbackTimerRef.current);
        }
      };
    }
  }, [
    isPlaying,
    isStoryMode,
    currentStoryIndex,
    sortedLogs.length,
    playbackSpeed,
    handleNext,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, []);

  return (
    <Card className="relative bg-slate-800/50 border-slate-700 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">나의 여행 지도</h2>
            {!isStoryMode && (
              <>
                {/* 검색창 */}
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="국가명 검색 (영문)"
                  className="ml-4 px-2 py-1 rounded bg-slate-900 text-slate-200 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ minWidth: 160 }}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isStoryMode && travelLogs.length > 0 && (
              <Button
                onClick={startStoryMode}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Film className="w-4 h-4 mr-2" />
                여행 스토리 재생
              </Button>
            )}
            {!isStoryMode && (
              <Button
                onClick={() => onAddPin(37.5665, 126.978)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                여행 기록 추가
              </Button>
            )}
          </div>
        </div>

        {/* World Map Container */}
        <div className="relative w-full h-[600px] bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg overflow-hidden">
          <MapComponent
            travelLogs={travelLogs}
            onPinClick={onPinClick}
            onAddPin={onAddPin}
            emotions={emotions}
            search={search}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            focusedLocation={focusedLocation}
            isStoryMode={isStoryMode}
          />

          {/* Click Hint - 좌측 상단 버튼과 겹치지 않게 중앙 하단으로 이동 */}
          {!isStoryMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 text-sm bg-slate-900/50 px-3 py-2 rounded-lg backdrop-blur-sm">
              <div className="space-y-1 text-center">
                <div>💡 지도를 클릭하여 새로운 여행 기록을 추가하세요</div>
                <div className="text-xs text-slate-500">
                  🖱️ 마우스 휠 또는 우측 버튼으로 확대/축소
                </div>
              </div>
            </div>
          )}

          {/* Legend - 우측 상단, map-component의 컨트롤과 겹치지 않게 */}
          {!isStoryMode && (
            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 z-20">
              <h4 className="text-xs font-medium text-white mb-2">감정 범례</h4>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(emotions)
                  .slice(0, 4)
                  .map(([key, emotion]) => (
                    <div key={key} className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: emotion.color }}
                      />
                      <span className="text-xs text-slate-300">
                        {emotion.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Story Mode Components */}
      {isStoryMode && sortedLogs.length > 0 && (
        <>
          {/* Story Preview Card */}
          <StoryPreviewCard
            travelLog={sortedLogs[currentStoryIndex]}
            emotion={emotions[sortedLogs[currentStoryIndex].emotion]}
            isVisible={isStoryMode}
          />

          {/* Playback Control */}
          <StoryPlaybackControl
            isPlaying={isPlaying}
            currentIndex={currentStoryIndex}
            totalStops={sortedLogs.length}
            speed={playbackSpeed}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSpeedChange={setPlaybackSpeed}
            onProgressChange={handleProgressChange}
            onClose={stopStoryMode}
            placeName={sortedLogs[currentStoryIndex].placeName}
            currentDate={new Date(
              sortedLogs[currentStoryIndex].createdAt
            ).toLocaleDateString("ko-KR")}
          />

          {/* Darkening Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={stopStoryMode}
          />
        </>
      )}
    </Card>
  );
}
