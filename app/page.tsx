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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [stories, setStories] = useState<TravelStory[]>([]);
  const [travelLogs, setTravelLogs] = useState<TravelLog[]>([
    {
      id: "1",
      userId: "user1",
      lat: 37.5665,
      lng: 126.978,
      placeName: "서울 한강공원",
      country: "South Korea",
      emotion: "peaceful",
      photos: [
        "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1581889870280-6e63fb07b9da?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1583954177945-5a9a7b2b8e1f?w=800&h=600&fit=crop",
      ],
      diary:
        "한강에서 바라본 노을이 정말 아름다웠다. 마음이 평온해지는 순간이었어. 강변을 따라 걸으며 서울의 야경을 감상했고, 치맥과 함께 완벽한 저녁을 보냈다.",
      tags: ["#한강", "#노을", "#평온", "#서울"],
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
      photos: [
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&h=600&fit=crop",
      ],
      diary:
        "시부야 스크램블 교차로의 에너지가 정말 대단했다! 도시의 활기를 온몸으로 느꼈어. 네온사인이 빛나는 밤거리를 걸으며 일본의 현대적인 면모를 체험했다.",
      tags: ["#도쿄", "#시부야", "#도시", "#일본"],
      createdAt: "2024-02-20",
    },
    {
      id: "us1",
      userId: "user1",
      lat: 40.7128,
      lng: -74.006,
      placeName: "New York",
      country: "United States",
      emotion: "happy",
      photos: [
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800&h=600&fit=crop",
      ],
      diary:
        "뉴욕의 자유의 여신상과 센트럴파크를 다녀왔다! 브로드웨이 뮤지컬도 보고 타임스퀘어의 화려한 불빛에 감탄했다. 진정한 도시의 에너지를 느꼈다.",
      tags: ["#뉴욕", "#미국", "#자유의여신상"],
      createdAt: "2023-07-10",
    },
    {
      id: "fr1",
      userId: "user1",
      lat: 48.8566,
      lng: 2.3522,
      placeName: "Paris",
      country: "France",
      emotion: "romantic",
      photos: [
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&h=600&fit=crop",
      ],
      diary:
        "에펠탑 야경이 너무 아름다웠다. 세느강을 따라 산책하며 파리의 낭만을 만끽했고, 작은 카페에서 크루아상과 커피를 즐기는 완벽한 하루였다.",
      tags: ["#파리", "#프랑스", "#에펠탑", "#낭만"],
      createdAt: "2022-05-15",
    },
    {
      id: "br1",
      userId: "user1",
      lat: -22.9068,
      lng: -43.1729,
      placeName: "Rio de Janeiro",
      country: "Brazil",
      emotion: "adventurous",
      photos: [
        "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1548963670-aaaa8f73a5e3?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800&h=600&fit=crop",
      ],
      diary:
        "코파카바나 해변에서 축제를 즐겼다! 삼바 리듬에 맞춰 춤추고 카이피리냐를 마시며 브라질의 열정을 느꼈다. 크리스토 헤덴토르 상에서 본 풍경도 잊을 수 없다.",
      tags: ["#리우", "#브라질", "#해변", "#축제"],
      createdAt: "2021-11-03",
    },
    {
      id: "za1",
      userId: "user1",
      lat: -33.9249,
      lng: 18.4241,
      placeName: "Cape Town",
      country: "South Africa",
      emotion: "peaceful",
      photos: [
        "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1591528036424-7b445086aa8c?w=800&h=600&fit=crop",
      ],
      diary:
        "테이블 마운틴에서 바라본 경치가 최고였다. 케이프 포인트에서 대서양과 인도양이 만나는 지점을 보며 자연의 웅장함에 압도되었다.",
      tags: ["#케이프타운", "#남아공", "#테이블마운틴"],
      createdAt: "2020-09-12",
    },
    {
      id: "au1",
      userId: "user1",
      lat: -33.8688,
      lng: 151.2093,
      placeName: "Sydney",
      country: "Australia",
      emotion: "excited",
      photos: [
        "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1549180030-48bf079fb38a?w=800&h=600&fit=crop",
      ],
      diary:
        "오페라 하우스와 해변 산책! 본다이 비치에서 서핑을 배우고 하버 브릿지를 건너며 시드니의 매력에 푹 빠졌다.",
      tags: ["#시드니", "#호주", "#오페라하우스", "#해변"],
      createdAt: "2019-02-28",
    },
    {
      id: "it1",
      userId: "user1",
      lat: 41.9028,
      lng: 12.4964,
      placeName: "Rome",
      country: "Italy",
      emotion: "nostalgic",
      photos: [
        "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&h=600&fit=crop",
      ],
      diary:
        "콜로세움을 보며 고대 로마 시대를 상상했다. 트레비 분수에 동전을 던지고 젤라또를 먹으며 로마의 골목길을 탐험했다. 역사가 살아 숨쉬는 도시.",
      tags: ["#로마", "#이탈리아", "#콜로세움", "#역사"],
      createdAt: "2023-09-22",
    },
    {
      id: "th1",
      userId: "user1",
      lat: 18.7883,
      lng: 98.9853,
      placeName: "Chiang Mai",
      country: "Thailand",
      emotion: "peaceful",
      photos: [
        "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1598970605070-92d6b4610c48?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=600&fit=crop",
      ],
      diary:
        "치앙마이의 사원들을 돌아보며 마음의 평화를 찾았다. 코끼리 보호소에서 코끼리들과 교감하고 나이트 마켓에서 맛있는 태국 음식을 즐겼다.",
      tags: ["#치앙마이", "#태국", "#사원", "#평화"],
      createdAt: "2024-01-18",
    },
    {
      id: "is1",
      userId: "user1",
      lat: 64.1466,
      lng: -21.9426,
      placeName: "Reykjavik",
      country: "Iceland",
      emotion: "adventurous",
      photos: [
        "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1520208422220-d12a3c588e6c?w=800&h=600&fit=crop",
      ],
      diary:
        "오로라를 보기 위해 찾은 아이슬란드. 블루 라군의 따뜻한 온천수에 몸을 담그고 골든 서클 투어로 게이시르와 굴포스 폭포를 경험했다. 자연의 경이로움!",
      tags: ["#레이캬비크", "#아이슬란드", "#오로라", "#모험"],
      createdAt: "2023-12-05",
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
  );
}
