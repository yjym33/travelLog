"use client";

import { Card } from "@/components/ui/card";
import type { TravelLog, Emotion } from "@/types/travel";
import { Globe } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

interface CountryMapProps {
  travelLogs: TravelLog[];
  emotions: Record<string, Emotion>;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function CountryMap({ travelLogs, emotions }: CountryMapProps) {
  // 국가별 방문 횟수 계산
  const countryCounts = travelLogs.reduce((acc, log) => {
    acc[log.country] = (acc[log.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const visitedCountries = Object.keys(countryCounts);

  // 국가별 대표 좌표 (첫 번째 방문지)
  const countryMarkers = Array.from(
    new Set(travelLogs.map((log) => log.country))
  ).map((country) => {
    const logs = travelLogs.filter((log) => log.country === country);
    const firstLog = logs[0];
    return {
      country,
      coordinates: [firstLog.lng, firstLog.lat] as [number, number],
      count: logs.length,
      emotion: emotions[firstLog.emotion],
    };
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">방문 국가 지도</h3>
        </div>
        <div className="text-sm text-slate-400">
          {visitedCountries.length}개국 방문
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4">
        <ComposableMap
          projectionConfig={{
            scale: 147,
          }}
          style={{
            width: "100%",
            height: "auto",
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isVisited = visitedCountries.includes(
                  geo.properties.name
                );
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isVisited ? "#8b5cf6" : "#334155"}
                    stroke="#1e293b"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: "none",
                      },
                      hover: {
                        fill: isVisited ? "#a78bfa" : "#475569",
                        outline: "none",
                      },
                      pressed: {
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* 마커 표시 */}
          {countryMarkers.map((marker, index) => (
            <Marker key={index} coordinates={marker.coordinates}>
              <g>
                <circle
                  r={6}
                  fill={marker.emotion.color}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{
                    cursor: "pointer",
                  }}
                />
                {marker.count > 1 && (
                  <text
                    textAnchor="middle"
                    y={-10}
                    style={{
                      fontFamily: "system-ui",
                      fill: "#fff",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {marker.count}
                  </text>
                )}
              </g>
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {/* 방문 국가 리스트 */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex flex-wrap gap-2">
          {Object.entries(countryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([country, count]) => (
              <div
                key={country}
                className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
              >
                {country} ({count})
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}
