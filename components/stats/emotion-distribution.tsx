"use client";

import { Card } from "@/components/ui/card";
import type { TravelLog, Emotion } from "@/types/travel";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Smile } from "lucide-react";

interface EmotionDistributionProps {
  travelLogs: TravelLog[];
  emotions: Record<string, Emotion>;
}

export default function EmotionDistribution({
  travelLogs,
  emotions,
}: EmotionDistributionProps) {
  // 감정별 카운트
  const emotionCounts = travelLogs.reduce((acc, log) => {
    acc[log.emotion] = (acc[log.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 차트 데이터 생성
  const chartData = Object.entries(emotionCounts).map(
    ([emotionKey, count]) => ({
      name: emotions[emotionKey]?.label || emotionKey,
      value: count,
      color: emotions[emotionKey]?.color || "#888888",
      emoji: emotions[emotionKey]?.emoji || "😊",
    })
  );

  // 커스텀 레이블
  const renderCustomLabel = (entry: any) => {
    return `${entry.emoji} ${entry.value}회`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Smile className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">감정 분포</h3>
      </div>

      {chartData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-slate-300">{`${entry.payload.emoji} ${value}`}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          아직 여행 기록이 없습니다
        </div>
      )}

      {/* 통계 요약 */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          {chartData.slice(0, 3).map((emotion, index) => (
            <div key={index} className="space-y-1">
              <div className="text-2xl">{emotion.emoji}</div>
              <div className="text-sm text-slate-400">{emotion.name}</div>
              <div className="text-lg font-semibold text-white">
                {emotion.value}회
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
