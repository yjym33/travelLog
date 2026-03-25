"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Heart } from "lucide-react";
import type { TravelLog, Emotion } from "@/types/travel";
import Image from "next/image";

interface StoryPreviewCardProps {
  travelLog: TravelLog;
  emotion: Emotion;
  isVisible: boolean;
}

export default function StoryPreviewCard({
  travelLog,
  emotion,
  isVisible,
}: StoryPreviewCardProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-2xl px-4"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
            {/* Photo Section */}
            {travelLog.photos.length > 0 && (
              <div className="relative h-80 overflow-hidden">
                <Image
                  src={travelLog.photos[0]}
                  alt={travelLog.placeName}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

                {/* Emotion Badge */}
                <motion.div
                  className="absolute top-6 right-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{ backgroundColor: emotion.color }}
                  >
                    <span className="text-3xl">{emotion.emoji}</span>
                  </div>
                </motion.div>

                {/* Photo Count */}
                {travelLog.photos.length > 1 && (
                  <div className="absolute top-6 left-6 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-white" />
                    <span className="text-sm text-white font-medium">
                      {travelLog.photos.length} 사진
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Content Section */}
            <div className="p-8">
              {/* Location & Date */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  <h2 className="text-3xl font-bold text-white">
                    {travelLog.placeName}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-slate-400 ml-8">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(travelLog.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-sm">{travelLog.country}</span>
                </div>
              </motion.div>

              {/* Emotion Label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800">
                  <span className="text-xl">{emotion.emoji}</span>
                  <span className="text-sm font-medium text-white">
                    {emotion.label}
                  </span>
                </div>
              </motion.div>

              {/* Diary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-4"
              >
                <p className="text-slate-300 leading-relaxed line-clamp-3">
                  {travelLog.diary}
                </p>
              </motion.div>

              {/* Tags */}
              {travelLog.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-2"
                >
                  {travelLog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
