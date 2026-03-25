"use client";

import { Card } from "@/components/ui/card";
import type { TravelLog } from "@/types/travel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface YearlyTravelChartProps {
  travelLogs: TravelLog[];
}

export default function YearlyTravelChart({
  travelLogs,
}: YearlyTravelChartProps) {
  // 연도별 여행 횟수 계산
  const yearCounts = travelLogs.reduce((acc, log) => {
    const year = new Date(log.createdAt).getFullYear();
    if (!isNaN(year)) {
      acc[year] = (acc[year] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  // 차트 데이터 생성 (연도순 정렬)
  const chartData = Object.entries(yearCounts)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({
      year,
      count,
    }));

  // 총 여행 수와 평균 계산
  const totalTrips = travelLogs.length;
  const avgPerYear =
    chartData.length > 0 ? (totalTrips / chartData.length).toFixed(1) : 0;

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">연도별 여행 패턴</h3>
      </div>

      {chartData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="year"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ fill: "#ec4899", r: 4 }}
              />
            </ComposedChart>
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
          <div className="space-y-1">
            <div className="text-sm text-slate-400">총 여행</div>
            <div className="text-2xl font-semibold text-white">
              {totalTrips}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-slate-400">활동 연도</div>
            <div className="text-2xl font-semibold text-white">
              {chartData.length}년
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-slate-400">연평균</div>
            <div className="text-2xl font-semibold text-white">
              {avgPerYear}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
