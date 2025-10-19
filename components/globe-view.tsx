"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TravelLog, Emotion } from "@/types/travel";
import {
  Globe2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Calendar,
  MapPin,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Dynamic import to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[700px] bg-slate-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Globe2 className="w-12 h-12 text-purple-400 mx-auto mb-2 animate-spin" />
        <div className="text-slate-400">3D 지구본을 불러오는 중...</div>
      </div>
    </div>
  ),
});

interface GlobeViewProps {
  travelLogs: TravelLog[];
  emotions: Record<string, Emotion>;
  onPinClick: (log: TravelLog) => void;
}

export default function GlobeView({
  travelLogs,
  emotions,
  onPinClick,
}: GlobeViewProps) {
  const globeEl = useRef<any>();
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 재생 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x
  const [isAutoRotate, setIsAutoRotate] = useState(false); // 재생 중엔 자동 회전 비활성화

  // 시간순 정렬된 여행 로그
  const sortedLogs = useMemo(() => {
    return [...travelLogs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [travelLogs]);

  // 현재 재생 중인 로그
  const currentLog = sortedLogs[currentIndex] || null;

  // 포인트 데이터 생성 (재생 중에는 현재 인덱스까지만 표시)
  const pointsData = useMemo(() => {
    const visibleLogs = isPlaying
      ? sortedLogs.slice(0, currentIndex + 1)
      : travelLogs;
    return visibleLogs.map((log, idx) => ({
      lat: log.lat,
      lng: log.lng,
      size: 0.5,
      color: emotions[log.emotion]?.color || "#8b5cf6",
      label: log.placeName,
      log: log,
      // 현재 재생 중인 포인트는 크게
      isActive: isPlaying && sortedLogs[currentIndex]?.id === log.id,
    }));
  }, [travelLogs, sortedLogs, currentIndex, isPlaying, emotions]);

  // 여행 경로 연결선 데이터 (재생 중에는 현재 인덱스까지만 표시)
  const arcsData = useMemo(() => {
    const maxIndex = isPlaying ? currentIndex : sortedLogs.length - 1;
    return sortedLogs
      .slice(0, maxIndex + 1)
      .map((log, index, arr) => {
        if (index === arr.length - 1) return null;
        const next = arr[index + 1];
        return {
          startLat: log.lat,
          startLng: log.lng,
          endLat: next.lat,
          endLng: next.lng,
          color: [
            emotions[log.emotion]?.color || "#8b5cf6",
            emotions[next.emotion]?.color || "#8b5cf6",
          ],
        };
      })
      .filter(Boolean) as any[];
  }, [sortedLogs, currentIndex, isPlaying, emotions]);

  // 여행지 라벨 데이터 (이름 표시)
  const labelsData = useMemo(() => {
    const visibleLogs = isPlaying
      ? sortedLogs.slice(0, currentIndex + 1)
      : travelLogs;
    return visibleLogs.map((log) => ({
      lat: log.lat,
      lng: log.lng,
      text: log.placeName,
      color: emotions[log.emotion]?.color || "#8b5cf6",
      size: 0.8,
    }));
  }, [travelLogs, sortedLogs, currentIndex, isPlaying, emotions]);

  // 초기 카메라 위치 설정
  useEffect(() => {
    if (globeEl.current && sortedLogs.length > 0) {
      const firstLog = sortedLogs[0];
      globeEl.current.pointOfView(
        {
          lat: firstLog.lat,
          lng: firstLog.lng,
          altitude: 2,
        },
        1000
      );
    }
  }, [sortedLogs]);

  // 타임라인 재생 로직
  useEffect(() => {
    if (isPlaying && sortedLogs.length > 0) {
      // 재생 간격 (속도에 따라 조정)
      const interval = 3000 / playbackSpeed; // 기본 3초

      playbackTimerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= sortedLogs.length - 1) {
            // 마지막에 도달하면 정지
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);

      return () => {
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
        }
      };
    }
  }, [isPlaying, playbackSpeed, sortedLogs.length]);

  // 현재 인덱스가 변경되면 카메라 이동
  useEffect(() => {
    if (globeEl.current && currentLog && isPlaying) {
      globeEl.current.pointOfView(
        {
          lat: currentLog.lat,
          lng: currentLog.lng,
          altitude: 1.5, // 재생 중에는 좀 더 가까이
        },
        1000 // 1초 동안 부드럽게 이동
      );
    }
  }, [currentIndex, currentLog, isPlaying]);

  // 자동 회전
  useEffect(() => {
    if (isAutoRotate && globeEl.current && !isPlaying) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    } else if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
    }
  }, [isAutoRotate, isPlaying]);

  // 재생 컨트롤 핸들러
  const handlePlay = () => {
    if (currentIndex >= sortedLogs.length - 1) {
      setCurrentIndex(0); // 마지막이면 처음부터
    }
    setIsPlaying(true);
    setIsAutoRotate(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentIndex < sortedLogs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSpeedChange = () => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value);
    setCurrentIndex(newIndex);
    setIsPlaying(false); // 슬라이더 이동 시 재생 정지
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
    if (globeEl.current && sortedLogs.length > 0) {
      const firstLog = sortedLogs[0];
      globeEl.current.pointOfView(
        {
          lat: firstLog.lat,
          lng: firstLog.lng,
          altitude: 2,
        },
        1000
      );
    }
  };

  const handleZoomIn = () => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      globeEl.current.pointOfView(
        {
          ...pov,
          altitude: Math.max(pov.altitude - 0.3, 0.5),
        },
        500
      );
    }
  };

  const handleZoomOut = () => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      globeEl.current.pointOfView(
        {
          ...pov,
          altitude: Math.min(pov.altitude + 0.3, 4),
        },
        500
      );
    }
  };

  const handlePointClick = (point: any) => {
    const clickedIndex = sortedLogs.findIndex((log) => log.id === point.log.id);
    if (clickedIndex !== -1) {
      setCurrentIndex(clickedIndex);
      setIsPlaying(false);
    }
    onPinClick(point.log);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">
            3D 시간 여행 지구본
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className="text-slate-300 hover:text-white"
            disabled={isPlaying}
          >
            {isAutoRotate ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                회전 멈춤
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                자동 회전
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="text-slate-300 hover:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="text-slate-300 hover:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-slate-300 hover:text-white"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            리셋
          </Button>
        </div>
      </div>

      {/* 타임라인 컨트롤 */}
      <div className="mb-4 bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
        <div className="flex items-center gap-4 mb-3">
          {/* 재생 컨트롤 버튼 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="text-slate-300 hover:text-white"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="sm"
              onClick={isPlaying ? handlePause : handlePlay}
              className={
                isPlaying
                  ? "bg-purple-500 hover:bg-purple-600 text-white"
                  : "text-slate-300 hover:text-white"
              }
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  일시정지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  재생
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= sortedLogs.length - 1}
              className="text-slate-300 hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* 속도 조절 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSpeedChange}
            className="text-slate-300 hover:text-white font-mono"
          >
            {playbackSpeed}x
          </Button>

          {/* 진행 상태 */}
          <div className="flex-1 text-center">
            <span className="text-sm text-slate-400 font-mono">
              {currentIndex + 1} / {sortedLogs.length}
            </span>
          </div>

          {/* 날짜 표시 */}
          {currentLog && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Calendar className="w-4 h-4" />
              {new Date(currentLog.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>

        {/* 타임라인 슬라이더 */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={Math.max(0, sortedLogs.length - 1)}
            value={currentIndex}
            onChange={handleTimelineChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${
                (currentIndex / Math.max(1, sortedLogs.length - 1)) * 100
              }%, #334155 ${
                (currentIndex / Math.max(1, sortedLogs.length - 1)) * 100
              }%, #334155 100%)`,
            }}
          />
        </div>
      </div>

      {/* 메인 컨텐츠: 지구본 + 정보 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 지구본 */}
        <div className="lg:col-span-8 relative bg-slate-900 rounded-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <Globe
              ref={globeEl}
              height={700}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              atmosphereColor="#8b5cf6"
              atmosphereAltitude={0.15}
              // Points
              pointsData={pointsData}
              pointAltitude={0.01}
              pointRadius={(d: any) => (d.isActive ? 1 : 0.5)}
              pointColor={(d: any) => d.color}
              pointLabel={(d: any) => `
              <div style="
                background: rgba(0, 0, 0, 0.95);
                padding: 10px 14px;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                border: 2px solid ${d.color};
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              ">
                <strong style="font-size: 16px;">${d.label}</strong>
              </div>
            `}
              onPointClick={handlePointClick}
              // Arcs (Travel Routes)
              arcsData={arcsData}
              arcColor={(d: any) => d.color}
              arcDashLength={0.4}
              arcDashGap={0.2}
              arcDashAnimateTime={2000}
              arcStroke={0.5}
              arcAltitude={0.3}
              arcAltitudeAutoScale={0.5}
              // Labels (Place Names)
              labelsData={labelsData}
              labelLat={(d: any) => d.lat}
              labelLng={(d: any) => d.lng}
              labelText={(d: any) => d.text}
              labelSize={(d: any) => d.size}
              labelDotRadius={0.4}
              labelColor={(d: any) => d.color}
              labelResolution={2}
              labelAltitude={0.02}
              // Interaction
              enablePointerInteraction={true}
            />
          </div>

          {/* 통계 오버레이 */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md rounded-lg p-4 border border-slate-700 z-10">
            <div className="flex items-center gap-6 text-slate-300">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {travelLogs.length}
                </div>
                <div className="text-xs text-slate-400">여행지</div>
              </div>
              <div className="h-10 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">
                  {new Set(travelLogs.map((log) => log.country)).size}
                </div>
                <div className="text-xs text-slate-400">국가</div>
              </div>
              <div className="h-10 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {arcsData.length}
                </div>
                <div className="text-xs text-slate-400">경로</div>
              </div>
            </div>
          </div>

          {/* 재생 중 인디케이터 */}
          {isPlaying && (
            <div className="absolute top-4 right-4 bg-purple-500/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 animate-pulse z-10">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="text-white text-sm font-semibold">재생 중</span>
            </div>
          )}
        </div>

        {/* 인터랙티브 정보 카드 */}
        <div className="lg:col-span-4">
          <AnimatePresence mode="wait">
            {currentLog ? (
              <motion.div
                key={currentLog.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/90 backdrop-blur-md rounded-lg p-6 border border-slate-700 h-[700px] overflow-y-auto"
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">
                        {emotions[currentLog.emotion]?.emoji || "📍"}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {currentLog.placeName}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {currentLog.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 감정 배지 */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{
                      backgroundColor: emotions[currentLog.emotion]?.color,
                    }}
                  >
                    {emotions[currentLog.emotion]?.label || currentLog.emotion}
                  </div>
                </div>

                {/* 날짜 & 위치 */}
                <div className="space-y-2 mb-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(currentLog.createdAt).toLocaleDateString(
                      "ko-KR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                      }
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {currentLog.lat.toFixed(4)}, {currentLog.lng.toFixed(4)}
                  </div>
                </div>

                {/* 태그 */}
                {currentLog.tags && currentLog.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {currentLog.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 사진 갤러리 */}
                {currentLog.photos && currentLog.photos.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        사진 {currentLog.photos.length}장
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentLog.photos.slice(0, 4).map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden bg-slate-800"
                        >
                          <Image
                            src={photo}
                            alt={`${currentLog.placeName} ${idx + 1}`}
                            fill
                            className="object-cover hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                    {currentLog.photos.length > 4 && (
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        +{currentLog.photos.length - 4}장 더보기
                      </p>
                    )}
                  </div>
                )}

                {/* 여행 일기 */}
                {currentLog.diary && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      {currentLog.diary}
                    </p>
                  </div>
                )}

                {/* 상세보기 버튼 */}
                <Button
                  variant="outline"
                  className="w-full text-purple-400 border-purple-500 hover:bg-purple-500/20"
                  onClick={() => onPinClick(currentLog)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  상세 정보 보기
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 h-[700px] flex items-center justify-center"
              >
                <div className="text-center text-slate-400">
                  <Globe2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    여행을 선택해주세요
                  </p>
                  <p className="text-sm">
                    재생 버튼을 누르거나 지구본의 포인트를 클릭하세요
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
