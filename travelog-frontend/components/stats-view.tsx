"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { TravelLog, Emotion } from "@/types/travel";
import EmotionDistribution from "./stats/emotion-distribution";
import CountryMap from "./stats/country-map";
import YearlyTravelChart from "./stats/yearly-travel-chart";
import TagWordCloud from "./stats/tag-wordcloud";
import MonthlyHeatmap from "./stats/monthly-heatmap";
import { BarChart3, MapPin, Heart, Tag, Calendar } from "lucide-react";

interface StatsViewProps {
  travelLogs: TravelLog[];
  emotions: Record<string, Emotion>;
}

export default function StatsView({ travelLogs, emotions }: StatsViewProps) {
  // 기본 통계 계산
  const totalTrips = travelLogs.length;
  const totalCountries = new Set(travelLogs.map((log) => log.country)).size;
  const totalPhotos = travelLogs.reduce(
    (sum, log) => sum + log.photos.length,
    0
  );
  const allTags = travelLogs.flatMap((log) => log.tags);
  const uniqueTags = new Set(allTags).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          여행 통계 대시보드
        </h2>
        <p className="text-slate-400">당신의 여행을 데이터로 되돌아보세요</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {totalTrips}
                </div>
                <div className="text-xs text-slate-300">총 여행 기록</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 border-pink-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {totalCountries}
                </div>
                <div className="text-xs text-slate-300">방문 국가</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {totalPhotos}
                </div>
                <div className="text-xs text-slate-300">추억 사진</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {uniqueTags}
                </div>
                <div className="text-xs text-slate-300">고유 태그</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 감정 분포 차트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <EmotionDistribution travelLogs={travelLogs} emotions={emotions} />
        </motion.div>

        {/* 연도별 여행 횟수 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <YearlyTravelChart travelLogs={travelLogs} />
        </motion.div>
      </div>

      {/* 방문 국가 맵 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <CountryMap travelLogs={travelLogs} emotions={emotions} />
      </motion.div>

      {/* 태그 워드클라우드 & 월별 히트맵 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <TagWordCloud travelLogs={travelLogs} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <MonthlyHeatmap travelLogs={travelLogs} />
        </motion.div>
      </div>
    </div>
  );
}
