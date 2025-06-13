"use client";

import type React from "react";
import { motion } from "framer-motion";
import { MapPin, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TravelLog, Emotion } from "@/types/travel";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";

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

  return (
    <Card className="relative bg-slate-800/50 border-slate-700 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">나의 여행 지도</h2>
            {/* 검색창 */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="국가명 검색 (영문)"
              className="ml-4 px-2 py-1 rounded bg-slate-900 text-slate-200 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{ minWidth: 160 }}
            />
          </div>
          <Button
            onClick={() => onAddPin(37.5665, 126.978)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            여행 기록 추가
          </Button>
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
          />

          {/* Click Hint */}
          <div className="absolute bottom-4 left-4 text-slate-400 text-sm bg-slate-900/50 px-3 py-2 rounded-lg backdrop-blur-sm">
            💡 지도를 클릭하여 새로운 여행 기록을 추가하세요
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3">
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
        </div>
      </div>
    </Card>
  );
}
