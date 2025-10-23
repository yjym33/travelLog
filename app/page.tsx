"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Grid3X3,
  Map,
  Plus,
  BarChart3,
  Globe2,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WorldMap from "@/components/world-map";
import TravelModal from "@/components/travel-modal";
import GalleryView from "@/components/gallery-view";
import TimelineView from "@/components/timeline-view";
import StatsView from "@/components/stats-view";
import GlobeView from "@/components/globe-view";
import FilterPanel from "@/components/filter-panel";
import ShareModal from "@/components/share-modal";
import StoryCreator from "@/components/story-creator";
import ShareImageGenerator from "@/components/share-image-generator";
import type { TravelLog } from "@/types/travel";
import type { FilterState } from "@/types/filter";
import type { TravelStory } from "@/types/story";
import { initialFilterState } from "@/types/filter";
import { exportTravelToPDF } from "@/utils/pdfExport";
import {
  filterTravelLogs,
  getUniqueTags,
  getUniqueCountries,
  hasActiveFilters,
  getFilterStats,
} from "@/utils/filterUtils";
import { useAuth } from "@/contexts/AuthContext";
import { travelApi } from "@/lib/api";
import AuthGuard from "@/components/auth-guard";

const emotions = {
  happy: { color: "#FFD700", emoji: "😊", label: "행복" },
  peaceful: { color: "#87CEEB", emoji: "😌", label: "평온" },
  excited: { color: "#FF6B6B", emoji: "🤩", label: "신남" },
  nostalgic: { color: "#DDA0DD", emoji: "🥺", label: "그리움" },
  adventurous: { color: "#32CD32", emoji: "🤠", label: "모험" },
  romantic: { color: "#FF69B4", emoji: "🥰", label: "로맨틱" },
};

export default function HomePage() {
  const { user, logout, token } = useAuth();
  const [viewMode, setViewMode] = useState<
    "map" | "gallery" | "timeline" | "stats" | "globe"
  >("map");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<TravelLog | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [stories, setStories] = useState<TravelStory[]>([]);
  const [travelLogs, setTravelLogs] = useState<TravelLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 여행 기록 로드 함수
  const loadTravelLogs = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const logs = await travelApi.getList(token);
      setTravelLogs(logs);
    } catch (error) {
      console.error("여행 기록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 여행 기록 로드
  React.useEffect(() => {
    loadTravelLogs();
  }, [token]);

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
      updatedAt: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleSaveLog = async (log: TravelLog) => {
    try {
      if (log.id) {
        // 수정된 경우 목록 새로고침
        await loadTravelLogs();
      } else {
        // 새로 생성된 경우 목록 새로고침
        await loadTravelLogs();
      }
      setIsModalOpen(false);
      setSelectedPin(null);
    } catch (error) {
      console.error("여행 기록 저장 후 새로고침 실패:", error);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      // 삭제 후 목록 새로고침
      await loadTravelLogs();
      setIsModalOpen(false);
      setSelectedPin(null);
    } catch (error) {
      console.error("여행 기록 삭제 후 새로고침 실패:", error);
    }
  };

  // 공유 기능
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleGenerateImage = (platform: string) => {
    // ShareImageGenerator가 자동으로 이미지를 생성합니다
    console.log("Generating image for", platform);
  };

  const handleImageGenerated = (blob: Blob) => {
    setShareImageBlob(blob);
    // 이미지 다운로드
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travelog-${selectedPin?.placeName || "share"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (selectedPin) {
      const emotion = emotions[selectedPin.emotion as keyof typeof emotions];
      exportTravelToPDF(selectedPin, emotion);
    }
  };

  const handleCreateStory = () => {
    setIsShareModalOpen(false);
    setIsStoryCreatorOpen(true);
  };

  const handleSaveStory = (
    story: Omit<TravelStory, "id" | "createdAt" | "updatedAt">
  ) => {
    const newStory: TravelStory = {
      ...story,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setStories((prev) => [...prev, newStory]);
    console.log("Story created:", newStory);
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
    <AuthGuard>
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
                {/* 사용자 정보 */}
                <div className="flex items-center gap-2 mr-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">
                    {user?.nickname || "사용자"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>

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
                <Button
                  variant={viewMode === "globe" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("globe")}
                  className="text-slate-300 hover:text-white"
                >
                  <Globe2 className="w-4 h-4 mr-2" />
                  3D 지구본
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
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">여행 기록을 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <>
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
                          <div className="text-sm text-slate-400">
                            필터 적용 결과
                          </div>
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
                    <StatsView
                      travelLogs={filteredTravelLogs}
                      emotions={emotions}
                    />
                  </motion.div>
                )}

                {viewMode === "globe" && (
                  <motion.div
                    key="globe"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GlobeView
                      travelLogs={filteredTravelLogs}
                      emotions={emotions}
                      onPinClick={handlePinClick}
                    />
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
                        {
                          new Set(filteredTravelLogs.map((log) => log.country))
                            .size
                        }
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
            </>
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
          onShare={handleShare}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          travelLog={selectedPin}
          onGenerateImage={handleGenerateImage}
          onExportPDF={handleExportPDF}
          onCreateStory={handleCreateStory}
        />

        {/* Story Creator */}
        <StoryCreator
          isOpen={isStoryCreatorOpen}
          onClose={() => setIsStoryCreatorOpen(false)}
          travelLogs={travelLogs}
          onCreateStory={handleSaveStory}
        />

        {/* Share Image Generator (hidden) */}
        {selectedPin && shareImageBlob === null && (
          <ShareImageGenerator
            travelLog={selectedPin}
            emotion={emotions[selectedPin.emotion as keyof typeof emotions]}
            template="modern"
            platform="instagram"
            onGenerated={handleImageGenerated}
          />
        )}
      </div>
    </AuthGuard>
  );
}
