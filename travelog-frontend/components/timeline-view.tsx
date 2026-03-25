"use client"

import { motion } from "framer-motion"
import { MapPin, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TravelLog, Emotion } from "@/types/travel"
import Image from "next/image"

interface TimelineViewProps {
  travelLogs: TravelLog[]
  emotions: Record<string, Emotion>
  onLogClick: (log: TravelLog) => void
}

export default function TimelineView({ travelLogs, emotions, onLogClick }: TimelineViewProps) {
  // Sort logs by date (newest first)
  const sortedLogs = [...travelLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Group by year and month
  const groupedLogs = sortedLogs.reduce(
    (acc, log) => {
      const date = new Date(log.createdAt)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!acc[yearMonth]) {
        acc[yearMonth] = []
      }
      acc[yearMonth].push(log)
      return acc
    },
    {} as Record<string, TravelLog[]>,
  )

  const formatMonthYear = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-")
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
    return `${year}년 ${monthNames[Number.parseInt(month) - 1]}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">여행 타임라인</h2>
        <p className="text-slate-400">시간 순으로 정리된 나의 여행 이야기</p>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>

        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([yearMonth, logs], groupIndex) => (
            <motion.div
              key={yearMonth}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              {/* Month Header */}
              <div className="relative flex items-center mb-6">
                <div className="absolute left-6 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-4 border-slate-900"></div>
                <div className="ml-16">
                  <h3 className="text-lg font-semibold text-white">{formatMonthYear(yearMonth)}</h3>
                  <p className="text-sm text-slate-400">{logs.length}개의 여행 기록</p>
                </div>
              </div>

              {/* Logs for this month */}
              <div className="ml-16 space-y-4">
                {logs.map((log, logIndex) => {
                  const emotion = emotions[log.emotion]

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 + logIndex * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-pointer"
                      onClick={() => onLogClick(log)}
                    >
                      <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all">
                        <div className="p-4">
                          <div className="flex gap-4">
                            {/* Photo */}
                            {log.photos[0] && (
                              <div className="flex-shrink-0">
                                <Image
                                  src={log.photos[0] || "/placeholder.svg"}
                                  alt={log.placeName}
                                  width={120}
                                  height={90}
                                  className="w-20 h-16 object-cover rounded-lg"
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-white mb-1">{log.placeName}</h4>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar className="w-3 h-3" />
                                    {log.createdAt}
                                  </div>
                                </div>
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                  style={{ backgroundColor: emotion.color }}
                                >
                                  {emotion.emoji}
                                </div>
                              </div>

                              <p className="text-slate-300 text-sm mb-2 line-clamp-2">{log.diary}</p>

                              {/* Tags */}
                              {log.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {log.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <Badge
                                      key={tagIndex}
                                      variant="secondary"
                                      className="text-xs bg-slate-700 text-slate-300"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {log.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                                      +{log.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {travelLogs.length === 0 && (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-slate-400 mb-4">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>아직 여행 기록이 없습니다</p>
              <p className="text-sm">지도에서 첫 번째 여행을 기록해보세요!</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
