"use client";

import type React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Search,
  Route,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TravelLog, Emotion } from "@/types/travel";
import Image from "next/image";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Line,
  Marker,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// 클러스터 타입
interface Cluster {
  lat: number;
  lng: number;
  logs: TravelLog[];
  isCluster: boolean;
}

// 두 지점 간 거리 계산 (픽셀 기준)
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

interface MapComponentProps {
  travelLogs: TravelLog[];
  onPinClick: (log: TravelLog) => void;
  onRemovePin?: (logId: string) => void;
  emotions: Record<string, Emotion>;
  search?: string;
  selectedCountry?: string | null;
  setSelectedCountry?: (name: string | null) => void;
  focusedLocation?: { lat: number; lng: number } | null;
  isStoryMode?: boolean;
  isRemoveMode?: boolean;
}

// 클러스터링 함수 - 줌 레벨에 따라 마커 그룹화
function clusterMarkers(
  logs: TravelLog[],
  zoom: number,
  projection: any
): Cluster[] {
  if (!logs || logs.length === 0) return [];

  // 줌 레벨에 따른 클러스터링 임계값 (픽셀 거리)
  // 줌이 낮을수록 (멀리서 볼수록) 더 많이 그룹화
  const clusterRadius = zoom < 1 ? 50 : zoom < 2 ? 40 : zoom < 3 ? 30 : 20;

  const clusters: Cluster[] = [];
  const used = new Set<number>();

  logs.forEach((log, i) => {
    if (used.has(i)) return;

    const [x1, y1] = projection([log.lng, log.lat]) || [0, 0];
    const clusterLogs: TravelLog[] = [log];
    used.add(i);

    // 가까운 다른 마커 찾기
    logs.forEach((otherLog, j) => {
      if (i === j || used.has(j)) return;

      const [x2, y2] = projection([otherLog.lng, otherLog.lat]) || [0, 0];
      const distance = getDistance(x1, y1, x2, y2);

      if (distance < clusterRadius) {
        clusterLogs.push(otherLog);
        used.add(j);
      }
    });

    // 클러스터 중심 계산 (평균)
    const avgLat =
      clusterLogs.reduce((sum, l) => sum + l.lat, 0) / clusterLogs.length;
    const avgLng =
      clusterLogs.reduce((sum, l) => sum + l.lng, 0) / clusterLogs.length;

    clusters.push({
      lat: avgLat,
      lng: avgLng,
      logs: clusterLogs,
      isCluster: clusterLogs.length > 1,
    });
  });

  return clusters;
}

export default function MapComponent({
  travelLogs,
  onPinClick,
  onRemovePin,
  emotions,
  search = "",
  selectedCountry = null,
  setSelectedCountry,
  focusedLocation = null,
  isStoryMode = false,
  isRemoveMode = false,
}: MapComponentProps) {
  const [zoom, setZoom] = useState(0.8); // 기본 줌을 낮춰서 더 넓은 범위 표시
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [hoveredCluster, setHoveredCluster] = useState<Cluster | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [showRoutes, setShowRoutes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  // Zoom control functions
  const MAX_ZOOM = 4; // 최대 줌 제한 (너무 가까이 못가게)
  const MIN_ZOOM = 0.5; // 최소 줌 제한

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.3, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.3, MIN_ZOOM));
  };

  const handleResetView = () => {
    setZoom(0.8);
    setCenter([0, 0]);
  };

  // Mouse wheel zoom handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!mapRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prevZoom) =>
        Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom + delta))
      );
    };

    const mapElement = mapRef.current;
    if (mapElement) {
      mapElement.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (mapElement) {
        mapElement.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  // (카드 로직 제거 - 이제 마커만 사용)

  // 국가별 방문 횟수 계산 (히트맵용)
  const countryVisitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    travelLogs.forEach((log) => {
      if (log.country) {
        counts[log.country] = (counts[log.country] || 0) + 1;
      }
    });
    return counts;
  }, [travelLogs]);

  // 최대 방문 횟수
  const maxVisitCount = Math.max(...Object.values(countryVisitCounts), 1);

  // 히트맵 색상 계산
  const getHeatmapColor = (countryName: string) => {
    if (!showHeatmap) return "#232323";
    const count = countryVisitCounts[countryName] || 0;
    if (count === 0) return "#232323";
    const intensity = count / maxVisitCount;
    // 보라색 그라데이션
    const r = Math.floor(139 + (107 - 139) * intensity);
    const g = Math.floor(92 + (70 - 92) * intensity);
    const b = Math.floor(246 + (246 - 246) * intensity);
    const alpha = 0.3 + intensity * 0.5;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 시간순 여행 경로 (긴 거리 경로 지원)
  const travelRoutes = useMemo(() => {
    if (travelLogs.length < 2) return [];

    const sorted = [...travelLogs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const routes = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // 경로가 지구 반대편을 지나는 경우 처리
      const lngDiff = Math.abs(next.lng - current.lng);
      const shouldWrap = lngDiff > 180;

      if (shouldWrap) {
        // 경로를 두 부분으로 나누어 표시 (지구 반대편 경로)
        const midLng = current.lng > 0 ? 180 : -180;

        routes.push({
          from: [current.lng, current.lat] as [number, number],
          to: [midLng, current.lat] as [number, number],
          color: emotions[current.emotion]?.color || "#8b5cf6",
          index: i,
          isWrapped: true,
          part: 1,
        });

        routes.push({
          from: [midLng, next.lat] as [number, number],
          to: [next.lng, next.lat] as [number, number],
          color: emotions[current.emotion]?.color || "#8b5cf6",
          index: i,
          isWrapped: true,
          part: 2,
        });
      } else {
        // 일반 경로
        routes.push({
          from: [current.lng, current.lat] as [number, number],
          to: [next.lng, next.lat] as [number, number],
          color: emotions[current.emotion]?.color || "#8b5cf6",
          index: i,
          isWrapped: false,
        });
      }
    }
    return routes;
  }, [travelLogs, emotions]);

  // 지도 범위 자동 조정 함수
  const adjustMapBounds = (logs: TravelLog[]) => {
    if (logs.length === 0) return;

    const lats = logs.map((log) => log.lat);
    const lngs = logs.map((log) => log.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // 경계에 여유 공간 추가
    const latPadding = Math.max((maxLat - minLat) * 0.1, 5);
    const lngPadding = Math.max((maxLng - minLng) * 0.1, 5);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // 지도 중심점과 줌 레벨 자동 조정
    setCenter([centerLng, centerLat]);

    // 적절한 줌 레벨 계산
    const latRange = maxLat - minLat + latPadding * 2;
    const lngRange = maxLng - minLng + lngPadding * 2;
    const maxRange = Math.max(latRange, lngRange);

    const zoomLevel = Math.max(0.5, Math.min(3, 180 / maxRange));
    setZoom(zoomLevel);
  };

  // 여행 기록이 추가될 때 지도 범위 자동 조정
  useEffect(() => {
    if (travelLogs.length > 0 && !isStoryMode) {
      adjustMapBounds(travelLogs);
    }
  }, [travelLogs.length, isStoryMode]);

  // Focus on location in story mode
  useEffect(() => {
    if (focusedLocation && isStoryMode) {
      setCenter([focusedLocation.lng, focusedLocation.lat]);
      setZoom(1.5); // 스토리 모드: 주변 지역도 보이도록 적절한 줌 레벨
    } else if (!isStoryMode) {
      // 스토리 모드 종료 시 원래 뷰로 복귀
      setZoom(0.8);
      setCenter([0, 0]);
    }
  }, [focusedLocation, isStoryMode]);

  useEffect(() => {
    if (!search) return;
    fetch(geoUrl)
      .then((res) => res.json())
      .then((data) => {
        const features =
          data.features || (data.objects && data.objects.countries && []);
        if (!features) return;
        const found = (features.features || features).find(
          (geo: any) =>
            (geo.properties.name || geo.properties.NAME || "").toLowerCase() ===
            search.toLowerCase()
        );
        if (found) {
          const centroid = geoCentroid(found);
          setCenter([centroid[0], centroid[1]]);
          setZoom(1.8); // 검색 시: 지역 단위로 적절하게
          setSelectedCountry &&
            setSelectedCountry(found.properties.name || found.properties.NAME);
        }
      });
  }, [search, setSelectedCountry]);

  const handleCountryClick = (geo: any, e: React.MouseEvent) => {
    const name = geo.properties.name || geo.properties.NAME || "";
    setSelectedCountry && setSelectedCountry(name);
    setCenter(geoCentroid(geo));
    setZoom(1.8); // 국가 클릭 시: 지역 단위로 적절하게
  };

  // 바다 영역 체크 함수
  const isOverOcean = (lat: number, lng: number): boolean => {
    // 주요 대륙 영역 정의 (더 정확한 경계)
    const landRegions = [
      // 아시아 (더 정확한 경계)
      { minLat: -10, maxLat: 75, minLng: 60, maxLng: 180 },
      { minLat: -10, maxLat: 75, minLng: -180, maxLng: -60 },

      // 유럽
      { minLat: 35, maxLat: 75, minLng: -25, maxLng: 40 },

      // 아프리카
      { minLat: -35, maxLat: 35, minLng: -20, maxLng: 55 },

      // 북아메리카
      { minLat: 15, maxLat: 75, minLng: -170, maxLng: -50 },

      // 남아메리카
      { minLat: -55, maxLat: 15, minLng: -85, maxLng: -30 },

      // 오세아니아
      { minLat: -50, maxLat: -10, minLng: 110, maxLng: 180 },
      { minLat: -50, maxLat: -10, minLng: -180, maxLng: -120 },
    ];

    return !landRegions.some(
      (region) =>
        lat >= region.minLat &&
        lat <= region.maxLat &&
        lng >= region.minLng &&
        lng <= region.maxLng
    );
  };

  // 좌표 검증 함수
  const validateCoordinates = (lat: number, lng: number): boolean => {
    return (
      lat >= -85 &&
      lat <= 85 &&
      lng >= -180 &&
      lng <= 180 &&
      !isNaN(lat) &&
      !isNaN(lng)
    );
  };

  // 핀 추가 모드가 제거되었으므로 handleMapClick 함수도 제거

  // 마커 호버 핸들러
  const handleMarkerHover = (
    cluster: Cluster,
    e: React.MouseEvent<SVGCircleElement>
  ) => {
    setHoveredCluster(cluster);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMarkerLeave = () => {
    setHoveredCluster(null);
    setTooltipPos(null);
  };

  // 클러스터 클릭 핸들러
  const handleClusterClick = (cluster: Cluster) => {
    if (isRemoveMode) {
      // 제거 모드일 때 핀 제거
      if (cluster.logs.length === 1 && onRemovePin) {
        if (
          confirm(
            `"${
              cluster.logs[0].placeName || "여행 기록"
            }"을(를) 삭제하시겠습니까?`
          )
        ) {
          onRemovePin(cluster.logs[0].id);
        }
      } else if (cluster.logs.length > 1) {
        // 클러스터인 경우 모든 핀 제거 확인
        if (
          confirm(
            `이 지역의 모든 여행 기록 ${cluster.logs.length}개를 삭제하시겠습니까?`
          )
        ) {
          cluster.logs.forEach((log) => {
            if (onRemovePin) onRemovePin(log.id);
          });
        }
      }
    } else {
      // 일반 모드
      if (cluster.isCluster && cluster.logs.length > 1) {
        // 클러스터면 줌인해서 마커들 분리 (점진적 확대)
        setCenter([cluster.lng, cluster.lat]);
        setZoom((prev) => Math.min(prev + 0.6, MAX_ZOOM));
      } else {
        // 단일 마커면 모달 열기
        onPinClick(cluster.logs[0]);
      }
    }
  };

  return (
    <div className="relative">
      {/* Controls - Hidden in story mode */}
      {!isStoryMode && (
        <>
          {/* Layer Controls - 좌측 상단으로 이동 */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoutes(!showRoutes)}
              className={`text-slate-300 hover:text-white ${
                showRoutes ? "bg-purple-500/20 border-purple-500" : ""
              }`}
            >
              {showRoutes ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  여행 경로
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  여행 경로
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`text-slate-300 hover:text-white ${
                showHeatmap ? "bg-purple-500/20 border-purple-500" : ""
              }`}
            >
              {showHeatmap ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  히트맵
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  히트맵
                </>
              )}
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className="bg-slate-900/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-800 hover:text-white"
              title="확대"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              className="bg-slate-900/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-800 hover:text-white"
              title="축소"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleResetView}
              className="bg-slate-900/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-800 hover:text-white"
              title="초기화"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            {/* Zoom Level Indicator */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-600 rounded-md px-2 py-1 text-center">
              <span className="text-xs text-white font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>
        </>
      )}

      {/* Legend - 우측 하단 줌 컨트롤 위로 이동 */}
      {showHeatmap &&
        countryVisitCounts &&
        Object.keys(countryVisitCounts).length > 0 && (
          <div className="absolute bottom-32 right-4 z-10 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3">
            <h4 className="text-xs font-medium text-white mb-2">방문 빈도</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">낮음</span>
              <div className="flex gap-1">
                {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                  <div
                    key={intensity}
                    className="w-4 h-4 rounded"
                    style={{
                      background: `rgba(139, 92, 246, ${
                        0.3 + intensity * 0.5
                      })`,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400">높음</span>
            </div>
          </div>
        )}

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
      `}</style>
      <div
        ref={mapRef}
        className={`relative w-full h-full ${
          isRemoveMode ? "cursor-pointer" : "cursor-pointer"
        }`}
        style={{
          background: "#181818",
        }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 100, center: [0, 0] }}
          style={{ width: "100%", height: "100%", backgroundColor: "#181818" }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ zoom, coordinates }) => {
              setZoom(zoom);
              setCenter(coordinates);
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies, projection }) => {
                // 클러스터 계산
                const clusters = clusterMarkers(travelLogs, zoom, projection);

                return (
                  <>
                    {/* 지리 데이터 (히트맵) */}
                    {geographies.map((geo) => {
                      const countryName =
                        geo.properties.name || geo.properties.NAME || "";
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getHeatmapColor(countryName)}
                          stroke="#222"
                          strokeWidth={0.7}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none" },
                            pressed: { outline: "none" },
                          }}
                          onClick={(e) => handleCountryClick(geo, e as any)}
                        />
                      );
                    })}

                    {/* 여행 경로 연결선 (개선된 버전) */}
                    {showRoutes &&
                      travelRoutes.map((route, index) => (
                        <Line
                          key={`route-${route.index}-${route.part || 0}`}
                          from={route.from}
                          to={route.to}
                          stroke={route.color}
                          strokeWidth={route.isWrapped ? 1.5 : 2}
                          strokeLinecap="round"
                          strokeDasharray={route.isWrapped ? "3,3" : "5,5"}
                          strokeOpacity={route.isWrapped ? 0.7 : 0.8}
                          style={{
                            animation: `dash 20s linear infinite`,
                          }}
                        />
                      ))}

                    {/* 마커 렌더링 */}
                    {clusters.map((cluster, idx) => {
                      // 클러스터의 대표 감정 (가장 최신 로그의 감정)
                      const latestLog = cluster.logs.sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )[0];
                      const emotion = emotions[latestLog.emotion];
                      const markerColor = emotion?.color || "#8b5cf6";

                      return (
                        <Marker
                          key={`marker-${idx}`}
                          coordinates={[cluster.lng, cluster.lat]}
                        >
                          {cluster.isCluster ? (
                            // 클러스터 마커 (여러 개 그룹화)
                            <g
                              onClick={() => handleClusterClick(cluster)}
                              onMouseEnter={(e: any) =>
                                handleMarkerHover(cluster, e)
                              }
                              onMouseLeave={handleMarkerLeave}
                              style={{ cursor: "pointer" }}
                            >
                              {/* 외곽 원 (펄스 효과) */}
                              <circle
                                r={18}
                                fill={markerColor}
                                fillOpacity={0.3}
                                className="animate-ping"
                              />
                              {/* 메인 원 */}
                              <circle
                                r={16}
                                fill={markerColor}
                                fillOpacity={0.9}
                                stroke="white"
                                strokeWidth={2.5}
                              />
                              {/* 개수 텍스트 */}
                              <text
                                textAnchor="middle"
                                y={6}
                                style={{
                                  fontFamily: "system-ui",
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  fill: "white",
                                  pointerEvents: "none",
                                }}
                              >
                                {cluster.logs.length}
                              </text>
                            </g>
                          ) : (
                            // 단일 마커
                            <g
                              onClick={() => handleClusterClick(cluster)}
                              onMouseEnter={(e: any) =>
                                handleMarkerHover(cluster, e)
                              }
                              onMouseLeave={handleMarkerLeave}
                              style={{ cursor: "pointer" }}
                              className="transition-transform hover:scale-125"
                            >
                              {/* 외곽 원 (호버 효과) */}
                              <circle
                                r={10}
                                fill={markerColor}
                                fillOpacity={0.2}
                              />
                              {/* 메인 원 */}
                              <circle
                                r={7}
                                fill={markerColor}
                                stroke="white"
                                strokeWidth={2}
                              />
                            </g>
                          )}
                        </Marker>
                      );
                    })}
                  </>
                );
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* 호버 툴팁 */}
      {hoveredCluster && tooltipPos && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl px-4 py-3 min-w-[200px]">
            {hoveredCluster.isCluster ? (
              // 클러스터 툴팁
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg font-bold text-white">
                    {hoveredCluster.logs.length}개 여행지
                  </div>
                </div>
                <div className="space-y-1">
                  {hoveredCluster.logs.slice(0, 3).map((log, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-300 flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: emotions[log.emotion]?.color,
                        }}
                      />
                      {log.placeName}
                    </div>
                  ))}
                  {hoveredCluster.logs.length > 3 && (
                    <div className="text-xs text-slate-500 mt-1">
                      +{hoveredCluster.logs.length - 3}개 더보기
                    </div>
                  )}
                </div>
                <div className="text-xs text-purple-400 mt-2 font-medium">
                  클릭하여 확대
                </div>
              </>
            ) : (
              // 단일 마커 툴팁
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {emotions[hoveredCluster.logs[0].emotion]?.emoji}
                  </span>
                  <div className="text-sm font-bold text-white">
                    {hoveredCluster.logs[0].placeName}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mb-1">
                  {hoveredCluster.logs[0].country}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(
                    hoveredCluster.logs[0].createdAt
                  ).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        emotions[hoveredCluster.logs[0].emotion]?.color,
                    }}
                  />
                  <span className="text-xs text-slate-300">
                    {emotions[hoveredCluster.logs[0].emotion]?.label}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>
    </div>
  );
}
