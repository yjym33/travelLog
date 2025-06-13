"use client"

import { motion } from "framer-motion"
import { MapPin, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TravelLog, Emotion } from "@/types/travel"
import Image from "next/image"

interface GalleryViewProps {
  travelLogs: TravelLog[]
  emotions: Record<string, Emotion>
  onLogClick: (log: TravelLog) => void
}

export default function GalleryView({ travelLogs, emotions, onLogClick }: GalleryViewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">여행 갤러리</h2>
        <p className="text-slate-400">감정과 함께 담은 소중한 순간들</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {travelLogs.map((log, index) => {
          const emotion = emotions[log.emotion]

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="cursor-pointer"
              onClick={() => onLogClick(log)}
            >
              <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-slate-600 transition-all">
                {/* Photo */}
                {log.photos[0] && (
                  <div className="relative">
                    <Image
                      src={log.photos[0] || "/placeholder.svg"}
                      alt={log.placeName}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg"
                        style={{ backgroundColor: emotion.color }}
                      >
                        {emotion.emoji}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white mb-1">{log.placeName}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {log.createdAt}
                      </div>
                    </div>
                  </div>

                  {/* Diary Preview */}
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">{log.diary}</p>

                  {/* Tags */}
                  {log.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {log.tags.slice(0, 3).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
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
              </Card>
            </motion.div>
          )
        })}
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
  )
}
