"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TravelLog, Emotion } from "@/types/travel";
import Image from "next/image";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapComponentProps {
  travelLogs: TravelLog[];
  onPinClick: (log: TravelLog) => void;
  onAddPin: (lat: number, lng: number) => void;
  emotions: Record<string, Emotion>;
  search?: string;
  selectedCountry?: string | null;
  setSelectedCountry?: (name: string | null) => void;
}

// 카드 데이터 타입 명시
interface CardDatum {
  lat: number;
  lng: number;
  placeName: string;
  country: string;
  dates: string[];
  logs: TravelLog[];
}

export default function MapComponent({
  travelLogs,
  onPinClick,
  onAddPin,
  emotions,
  search = "",
  selectedCountry = null,
  setSelectedCountry,
}: MapComponentProps) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [tooltip, setTooltip] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // 장소별로 그룹핑 (장소명+국가명 기준)
  const groupedLogs = travelLogs.reduce((acc, log) => {
    const key = `${log.placeName}|${log.country || ""}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {} as Record<string, TravelLog[]>);

  // 카드 렌더링용 데이터
  const cardData: CardDatum[] = Object.values(groupedLogs).map(
    (logs: TravelLog[]) => {
      // 최신순 정렬
      const sorted = [...logs].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const { lat, lng, placeName, country } = sorted[0];
      return {
        lat,
        lng,
        placeName,
        country,
        dates: sorted.map((l) => l.createdAt),
        logs: sorted,
      };
    }
  );

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
          setZoom(2.5);
          setSelectedCountry &&
            setSelectedCountry(found.properties.name || found.properties.NAME);
          setTooltip(null);
        }
      });
  }, [search]);

  const handleCountryClick = (geo: any, e: React.MouseEvent) => {
    const name = geo.properties.name || geo.properties.NAME || "";
    setSelectedCountry && setSelectedCountry(name);
    setCenter(geoCentroid(geo));
    setZoom(2.5);
    setTooltip({ name, x: e.clientX, y: e.clientY });
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert click position to approximate lat/lng (simplified)
    const lat = 90 - (y / rect.height) * 180;
    const lng = (x / rect.width) * 360 - 180;

    onAddPin(lat, lng);
  };

  const getPinPosition = (lat: number, lng: number) => {
    // Convert lat/lng to pixel position (simplified)
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  // 카드 위치 계산 (SVG projection 좌표)
  const getProjectedCardPositions = (
    cardData: CardDatum[],
    projection: any
  ) => {
    // 각 카드의 원래 위치
    let positions = cardData.map((card: CardDatum) => {
      const [x, y] = projection([card.lng, card.lat]) || [0, 0];
      return { x, y, card, originalX: x, originalY: y };
    });

    // 강화된 충돌 방지 알고리즘
    const cardWidth = 160;
    const cardHeight = 120;
    const padding = 20; // 카드 간 최소 여백
    const minDist = Math.max(cardWidth, cardHeight) + padding;

    // Force-directed 알고리즘으로 충돌 해결
    for (let iter = 0; iter < 15; iter++) {
      let moved = false;

      for (let i = 0; i < positions.length; i++) {
        let forceX = 0;
        let forceY = 0;

        for (let j = 0; j < positions.length; j++) {
          if (i === j) continue;

          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist && dist > 0) {
            // 카드들이 겹치면 밀어내기
            const pushForce = (minDist - dist) / dist;
            forceX += dx * pushForce * 0.8; // 더 강한 힘으로 밀기
            forceY += dy * pushForce * 0.8;
            moved = true;
          }
        }

        // 원래 위치로 되돌아가려는 힘 (약하게)
        const returnForceX = (positions[i].originalX - positions[i].x) * 0.05;
        const returnForceY = (positions[i].originalY - positions[i].y) * 0.05;

        positions[i].x += forceX + returnForceX;
        positions[i].y += forceY + returnForceY;
      }

      // 더 이상 움직임이 없으면 조기 종료
      if (!moved) break;
    }

    // 최종 겹침 검사 및 강제 분리
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
          // 여전히 겹치면 강제로 분리
          const angle = Math.atan2(dy, dx);
          const targetDist = minDist + 10; // 여유 공간 추가
          const currentDist = dist || 1; // 0으로 나누기 방지

          const moveDistance = (targetDist - currentDist) / 2;
          positions[i].x += Math.cos(angle) * moveDistance;
          positions[i].y += Math.sin(angle) * moveDistance;
          positions[j].x -= Math.cos(angle) * moveDistance;
          positions[j].y -= Math.sin(angle) * moveDistance;
        }
      }
    }

    // 경계 확인 및 조정 (화면 밖으로 나가지 않도록)
    const margin = 100;
    positions.forEach((pos) => {
      if (pos.x < margin) pos.x = margin;
      if (pos.y < margin) pos.y = margin;
      if (pos.x > 800 - margin) pos.x = 800 - margin;
      if (pos.y > 400 - margin) pos.y = 400 - margin;
    });

    return positions;
  };

  return (
    <div
      ref={mapRef}
      className="relative w-full h-full cursor-crosshair"
      style={{ background: "#181818" }}
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
              // 카드 위치 계산 (충돌 방지 적용)
              const cardPositions = getProjectedCardPositions(
                cardData,
                projection
              );
              return (
                <>
                  {geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#232323"
                      stroke="#222"
                      strokeWidth={0.7}
                      style={{ default: { outline: "none" } }}
                    />
                  ))}
                  {/* 카드, 핀, 선 */}
                  {cardPositions.map(
                    (
                      pos: {
                        x: number;
                        y: number;
                        card: CardDatum;
                        originalX: number;
                        originalY: number;
                      },
                      idx: number
                    ) => {
                      const { x, y, card } = pos;
                      const [pinX, pinY] = projection([card.lng, card.lat]) || [
                        0, 0,
                      ];
                      return (
                        <g key={idx} style={{ pointerEvents: "auto" }}>
                          {/* 선 (카드 중심 → 핀) */}
                          <line
                            x1={x}
                            y1={y}
                            x2={pinX}
                            y2={pinY}
                            stroke="#a78bfa"
                            strokeWidth={1.5}
                          />
                          {/* 카드 */}
                          <foreignObject
                            x={x - 80}
                            y={y - 120}
                            width={160}
                            height={120}
                            style={{ overflow: "visible" }}
                          >
                            <div
                              className="rounded-xl shadow-xl bg-black/80 border border-slate-800 px-5 py-4 text-white flex flex-col items-center select-none"
                              style={{ minHeight: 120, cursor: "pointer" }}
                              onClick={() => onPinClick(card.logs[0])}
                            >
                              <div
                                className="text-2xl font-extrabold leading-tight tracking-tight text-left w-full"
                                style={{ wordBreak: "break-word" }}
                              >
                                {card.placeName
                                  .split(" ")
                                  .map((w: string, i: number) => (
                                    <div key={i}>{w.toLowerCase()}</div>
                                  ))}
                              </div>
                              <div
                                className="text-xs text-slate-300 font-semibold mb-2 w-full text-left"
                                style={{ textTransform: "lowercase" }}
                              >
                                {card.country}
                              </div>
                              <div className="flex flex-col gap-1 w-full text-left">
                                {card.dates.map((date: string, i: number) => (
                                  <div
                                    key={i}
                                    className="bg-slate-800/60 rounded px-2 py-0.5 text-xs font-mono tracking-wide"
                                  >
                                    {new Date(date).toLocaleString("en-US", {
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </foreignObject>
                          {/* 핀 */}
                          <circle
                            cx={pinX}
                            cy={pinY}
                            r={8}
                            fill="#232323"
                            stroke="#a78bfa"
                            strokeWidth={2}
                          />
                        </g>
                      );
                    }
                  )}
                </>
              );
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
