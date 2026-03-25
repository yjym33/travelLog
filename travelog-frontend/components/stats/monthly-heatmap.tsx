"use client";

import { Card } from "@/components/ui/card";
import type { TravelLog } from "@/types/travel";
import { Calendar } from "lucide-react";
import { useMemo } from "react";

interface MonthlyHeatmapProps {
  travelLogs: TravelLog[];
}

export default function MonthlyHeatmap({ travelLogs }: MonthlyHeatmapProps) {
  const months = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  // 월별 여행 카운트 계산
  const monthCounts = useMemo(() => {
    const counts: number[] = Array(12).fill(0);
    travelLogs.forEach((log) => {
      const date = new Date(log.createdAt);
      const month = date.getMonth();
      if (!isNaN(month)) {
        counts[month]++;
      }
    });
    return counts;
  }, [travelLogs]);

  const maxCount = Math.max(...monthCounts, 1);

  // 색상 강도 계산
  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    return (count / maxCount) * 100;
  };

  // 배경색 계산
  const getBackgroundColor = (count: number) => {
    if (count === 0) return "bg-slate-700/30";
    const intensity = getIntensity(count);
    if (intensity < 25) return "bg-purple-500/20";
    if (intensity < 50) return "bg-purple-500/40";
    if (intensity < 75) return "bg-purple-500/60";
    return "bg-purple-500/80";
  };

  // 가장 활발한 달 찾기
  const mostActiveMonth = monthCounts.indexOf(maxCount);
  const leastActiveMonths = monthCounts
    .map((count, index) => (count === 0 ? index : -1))
    .filter((index) => index !== -1);

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-pink-400" />
        <h3 className="text-lg font-semibold text-white">월별 여행 활동</h3>
      </div>

      {/* 히트맵 */}
      <div className="bg-slate-900/50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-3">
          {months.map((month, index) => (
            <div
              key={month}
              className={`relative p-4 rounded-lg transition-all hover:scale-105 cursor-pointer ${getBackgroundColor(
                monthCounts[index]
              )}`}
              title={`${month}: ${monthCounts[index]}회`}
            >
              <div className="text-center">
                <div className="text-sm text-slate-300 font-medium">
                  {month}
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {monthCounts[index]}
                </div>
                {monthCounts[index] > 0 && (
                  <div className="text-xs text-slate-400 mt-1">
                    {((monthCounts[index] / travelLogs.length) * 100).toFixed(
                      0
                    )}
                    %
                  </div>
                )}
              </div>

              {/* 가장 활발한 달 표시 */}
              {index === mostActiveMonth && monthCounts[index] > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs">
                  🔥
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 범례 */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-slate-400">적음</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-slate-700/30 rounded" />
            <div className="w-4 h-4 bg-purple-500/20 rounded" />
            <div className="w-4 h-4 bg-purple-500/40 rounded" />
            <div className="w-4 h-4 bg-purple-500/60 rounded" />
            <div className="w-4 h-4 bg-purple-500/80 rounded" />
          </div>
          <span className="text-xs text-slate-400">많음</span>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400 mb-1">가장 활발한 달</div>
            <div className="text-white font-semibold">
              {maxCount > 0
                ? `${months[mostActiveMonth]} (${maxCount}회)`
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">여행 없는 달</div>
            <div className="text-white font-semibold">
              {leastActiveMonths.length > 0
                ? `${leastActiveMonths.length}개월`
                : "없음"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
