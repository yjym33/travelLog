"use client";

import { Card } from "@/components/ui/card";
import type { TravelLog } from "@/types/travel";
import { Hash } from "lucide-react";
import { useMemo } from "react";

interface TagWordCloudProps {
  travelLogs: TravelLog[];
}

export default function TagWordCloud({ travelLogs }: TagWordCloudProps) {
  // 태그별 카운트 계산
  const tagCounts = useMemo(() => {
    const counts = travelLogs.reduce((acc, log) => {
      log.tags.forEach((tag) => {
        const cleanTag = tag.replace(/^#/, ""); // # 제거
        acc[cleanTag] = (acc[cleanTag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // 상위 20개만
  }, [travelLogs]);

  // 최대/최소값 계산
  const maxCount = Math.max(...tagCounts.map(([_, count]) => count), 1);
  const minCount = Math.min(...tagCounts.map(([_, count]) => count), 1);

  // 폰트 크기 계산 함수
  const getFontSize = (count: number) => {
    const ratio = (count - minCount) / (maxCount - minCount || 1);
    return 12 + ratio * 32; // 12px ~ 44px
  };

  // 색상 계산 함수
  const getColor = (count: number) => {
    const colors = [
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // amber
      "#6366f1", // indigo
    ];
    const index = Math.floor((count / maxCount) * (colors.length - 1));
    return colors[Math.min(index, colors.length - 1)];
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">인기 태그</h3>
      </div>

      {tagCounts.length > 0 ? (
        <>
          {/* 워드클라우드 */}
          <div className="min-h-[280px] bg-slate-900/50 rounded-lg p-6 flex flex-wrap items-center justify-center gap-3">
            {tagCounts.map(([tag, count], index) => (
              <div
                key={tag}
                className="inline-block hover:scale-110 transition-transform cursor-pointer"
                style={{
                  fontSize: `${getFontSize(count)}px`,
                  color: getColor(count),
                  fontWeight: count > maxCount / 2 ? "bold" : "normal",
                  animation: `fadeIn 0.5s ease-in-out ${index * 0.05}s both`,
                }}
                title={`${count}회 사용`}
              >
                #{tag}
              </div>
            ))}
          </div>

          {/* 상위 태그 리스트 */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400 mb-2">Top 5 태그</div>
            <div className="space-y-2">
              {tagCounts.slice(0, 5).map(([tag, count], index) => (
                <div key={tag} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">
                      {index + 1}
                    </div>
                    <span className="text-slate-300">#{tag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-slate-700 rounded-full w-20 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-400 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          아직 태그가 없습니다
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Card>
  );
}
