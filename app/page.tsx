"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Grid3X3, Map, Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WorldMap from "@/components/world-map";
import TravelModal from "@/components/travel-modal";
import GalleryView from "@/components/gallery-view";
import TimelineView from "@/components/timeline-view";
import StatsView from "@/components/stats-view";
import FilterPanel from "@/components/filter-panel";
import type { TravelLog } from "@/types/travel";
import type { FilterState } from "@/types/filter";
import { initialFilterState } from "@/types/filter";
import {
  filterTravelLogs,
  getUniqueTags,
  getUniqueCountries,
  hasActiveFilters,
  getFilterStats,
} from "@/utils/filterUtils";

const emotions = {
  happy: { color: "#FFD700", emoji: "😊", label: "행복" },
  peaceful: { color: "#87CEEB", emoji: "😌", label: "평온" },
  excited: { color: "#FF6B6B", emoji: "🤩", label: "신남" },
  nostalgic: { color: "#DDA0DD", emoji: "🥺", label: "그리움" },
  adventurous: { color: "#32CD32", emoji: "🤠", label: "모험" },
  romantic: { color: "#FF69B4", emoji: "🥰", label: "로맨틱" },
};

export default function HomePage() {
  const [viewMode, setViewMode] = useState<
    "map" | "gallery" | "timeline" | "stats"
  >("map");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<TravelLog | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [travelLogs, setTravelLogs] = useState<TravelLog[]>([
    {
      id: "1",
      userId: "user1",
      lat: 37.5665,
      lng: 126.978,
      placeName: "서울 한강공원",
      country: "South Korea",
      emotion: "peaceful",
      photos: ["/placeholder.svg?height=300&width=400"],
      diary:
        "한강에서 바라본 노을이 정말 아름다웠다. 마음이 평온해지는 순간이었어.",
      tags: ["#한강", "#노을", "#평온"],
      createdAt: "2024-03-15",
    },
    {
      id: "2",
      userId: "user1",
      lat: 35.6762,
      lng: 139.6503,
      placeName: "도쿄 시부야",
      country: "Japan",
      emotion: "excited",
      photos: ["/placeholder.svg?height=300&width=400"],
      diary:
        "시부야 스크램블 교차로의 에너지가 정말 대단했다! 도시의 활기를 온몸으로 느꼈어.",
      tags: ["#도쿄", "#시부야", "#도시"],
      createdAt: "2024-02-20",
    },
    // 미국
    {
      id: "us1",
      userId: "user1",
      lat: 40.7128,
      lng: -74.006,
      placeName: "New York",
      country: "United States",
      emotion: "happy",
      photos: ["/placeholder.svg?height=300&width=400"],
      diary: "뉴욕의 자유의 여신상과 센트럴파크를 다녀왔다!",
      tags: ["#뉴욕", "#미국"],
      createdAt: "2023-07-10",
    },
    // 프랑스
    {
      id: "fr1",
      userId: "user1",
      lat: 48.8566,
      lng: 2.3522,
      placeName: "Paris",
      country: "France",
      emotion: "romantic",
      photos: ["/placeholder.svg?height=300&width=400"],
      diary: "에펠탑 야경이 너무 아름다웠다.",
      tags: ["#파리", "#프랑스"],
      createdAt: "2022-05-15",
    },
    // 브라질
    {
      id: "br1",
      userId: "user1",
      lat: -22.9068,
      lng: -43.1729,
      placeName: "Rio de Janeiro",
      country: "Brazil",
      emotion: "adventurous",
      photos: ["/placeholder.svg?height=300&width=400"],
      diary: "코파카바나 해변에서 축제를 즐겼다!",
      tags: ["#리우", "#브라질"],
      createdAt: "2021-11-03",
    },
    // 남아프리카공화국
    {
      id: "za1",
      userId: "user1",
      lat: -33.9249,
      lng: 18.4241,
      placeName: "Cape Town",
      country: "South Africa",
      emotion: "peaceful",
      photos: ["/placeholder.svg?height=300&width=400"],
      diary: "테이블 마운틴에서 바라본 경치가 최고였다.",
      tags: ["#케이프타운", "#남아공"],
      createdAt: "2020-09-12",
    },
    // 호주
    {
      id: "au1",
      userId: "user1",
      lat: -33.8688,
      lng: 151.2093,
      placeName: "Sydney",
      country: "Australia",
      emotion: "excited",
      photos: ["/placeholder.svg?height=300&width=400"],
      diary: "오페라 하우스와 해변 산책!",
      tags: ["#시드니", "#호주"],
      createdAt: "2019-02-28",
    },
  ]);

  const handlePinClick = (pin: TravelLog) => {
    setSelectedPin(pin);
    setIsModalOpen(true);
  };

  const handleAddPin = (lat: number, lng: number) => {
    setSelectedPin({
      id: "",
      userId: "user1",
      lat,
      lng,
      placeName: "",
      country: "",
      emotion: "happy",
      photos: [],
      diary: "",
      tags: [],
      createdAt: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleSaveLog = (log: TravelLog) => {
    if (log.id) {
      setTravelLogs((prev) =>
        prev.map((item) => (item.id === log.id ? log : item))
      );
    } else {
      const newLog = { ...log, id: Date.now().toString() };
      setTravelLogs((prev) => [...prev, newLog]);
    }
    setIsModalOpen(false);
    setSelectedPin(null);
  };

  const handleDeleteLog = (id: string) => {
    setTravelLogs((prev) => prev.filter((item) => item.id !== id));
    setIsModalOpen(false);
    setSelectedPin(null);
  };

  // 필터링된 여행 기록 계산
  const filteredTravelLogs = useMemo(() => {
    return filterTravelLogs(travelLogs, filters);
  }, [travelLogs, filters]);

  // 필터에 사용할 고유 태그와 국가 추출
  const availableTags = useMemo(() => getUniqueTags(travelLogs), [travelLogs]);
  const availableCountries = useMemo(
    () => getUniqueCountries(travelLogs),
    [travelLogs]
  );

  // 필터 통계
  const filterStats = useMemo(
    () => getFilterStats(travelLogs.length, filteredTravelLogs.length),
    [travelLogs.length, filteredTravelLogs.length]
  );

  // 활성 필터 여부
  const isFiltered = hasActiveFilters(filters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Travelog
              </h1>
            </motion.div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="text-slate-300 hover:text-white"
              >
                <Map className="w-4 h-4 mr-2" />
                지도
              </Button>
              <Button
                variant={viewMode === "gallery" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("gallery")}
                className="text-slate-300 hover:text-white"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                갤러리
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                className="text-slate-300 hover:text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                타임라인
              </Button>
              <Button
                variant={viewMode === "stats" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("stats")}
                className="text-slate-300 hover:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                통계
              </Button>
              <div className="h-6 w-px bg-slate-600 mx-2" />
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                emotions={emotions}
                availableTags={availableTags}
                availableCountries={availableCountries}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* 필터 결과 배너 */}
        {isFiltered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">필터 적용 결과</div>
                    <div className="text-lg font-semibold text-white">
                      {filterStats.filtered}개 / {filterStats.total}개{" "}
                      <span className="text-sm text-purple-400">
                        ({filterStats.percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(initialFilterState)}
                  className="text-slate-300 hover:text-white"
                >
                  필터 초기화
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {viewMode === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WorldMap
                travelLogs={filteredTravelLogs}
                onPinClick={handlePinClick}
                onAddPin={handleAddPin}
                emotions={emotions}
              />
            </motion.div>
          )}

          {viewMode === "gallery" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GalleryView
                travelLogs={filteredTravelLogs}
                emotions={emotions}
                onLogClick={handlePinClick}
              />
            </motion.div>
          )}

          {viewMode === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TimelineView
                travelLogs={filteredTravelLogs}
                emotions={emotions}
                onLogClick={handlePinClick}
              />
            </motion.div>
          )}

          {viewMode === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StatsView travelLogs={filteredTravelLogs} emotions={emotions} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Card */}
        <motion.div
          className="fixed bottom-6 right-6 z-30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 p-4">
            <div className="flex items-center gap-4 text-slate-300">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {filteredTravelLogs.length}
                </div>
                <div className="text-xs">
                  {isFiltered ? "필터된 기록" : "여행 기록"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">
                  {new Set(filteredTravelLogs.map((log) => log.country)).size}
                </div>
                <div className="text-xs">방문 국가</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Add Button for Mobile */}
        {viewMode === "map" && (
          <motion.div
            className="fixed bottom-6 left-6 z-30 md:hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => handleAddPin(37.5665, 126.978)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </main>

      {/* Travel Modal */}
      <TravelModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPin(null);
        }}
        travelLog={selectedPin}
        emotions={emotions}
        onSave={handleSaveLog}
        onDelete={handleDeleteLog}
      />
    </div>
  );
}
