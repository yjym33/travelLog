"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TravelLog, Emotion } from "@/types/travel";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PhotoSlideshow from "./photo-slideshow";

interface GalleryViewProps {
  travelLogs: TravelLog[];
  emotions: Record<string, Emotion>;
  onLogClick: (log: TravelLog) => void;
}

interface SortableCardProps {
  log: TravelLog;
  emotion: Emotion;
  index: number;
  onLogClick: (log: TravelLog) => void;
  onPhotoClick: (log: TravelLog, photoIndex: number) => void;
}

function SortableCard({
  log,
  emotion,
  index,
  onLogClick,
  onPhotoClick,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: log.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="cursor-pointer"
    >
      <Card className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-slate-600 transition-all">
        {/* Photo */}
        {log.photos[0] && (
          <div
            className="relative group"
            onClick={(e) => {
              e.stopPropagation();
              onPhotoClick(log, 0);
            }}
          >
            <Image
              src={log.photos[0] || "/placeholder.svg"}
              alt={log.placeName}
              width={400}
              height={250}
              className="w-full h-48 object-cover transition-transform group-hover:scale-105"
            />
            {/* Photo Count Badge */}
            {log.photos.length > 1 && (
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-white" />
                <span className="text-xs text-white font-medium">
                  {log.photos.length}
                </span>
              </div>
            )}
            <div className="absolute top-3 right-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg"
                style={{ backgroundColor: emotion.color }}
              >
                {emotion.emoji}
              </div>
            </div>
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        )}

        <div className="p-4" {...attributes} {...listeners}>
          {/* Drag Handle Indicator */}
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <div className="flex gap-0.5">
              <div className="w-1 h-3 bg-slate-600 rounded-full"></div>
              <div className="w-1 h-3 bg-slate-600 rounded-full"></div>
              <div className="w-1 h-3 bg-slate-600 rounded-full"></div>
            </div>
            <span>드래그하여 순서 변경</span>
          </div>

          {/* Header */}
          <div
            className="flex items-start justify-between mb-3"
            onClick={() => onLogClick(log)}
          >
            <div>
              <h3 className="font-semibold text-white mb-1">{log.placeName}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="w-3 h-3" />
                {log.createdAt}
              </div>
            </div>
          </div>

          {/* Diary Preview */}
          <p
            className="text-slate-300 text-sm mb-3 line-clamp-2"
            onClick={() => onLogClick(log)}
          >
            {log.diary}
          </p>

          {/* Tags */}
          {log.tags.length > 0 && (
            <div
              className="flex flex-wrap gap-1"
              onClick={() => onLogClick(log)}
            >
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
                <Badge
                  variant="secondary"
                  className="text-xs bg-slate-700 text-slate-300"
                >
                  +{log.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function GalleryView({
  travelLogs,
  emotions,
  onLogClick,
}: GalleryViewProps) {
  const [items, setItems] = useState(travelLogs);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TravelLog | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Update items when travelLogs change
  useState(() => {
    setItems(travelLogs);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handlePhotoClick = (log: TravelLog, photoIndex: number) => {
    setSelectedLog(log);
    setSelectedPhotoIndex(photoIndex);
    setSlideshowOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">여행 갤러리</h2>
        <p className="text-slate-400">
          감정과 함께 담은 소중한 순간들 · 드래그하여 순서 변경 가능
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((log, index) => {
              const emotion = emotions[log.emotion];

              return (
                <SortableCard
                  key={log.id}
                  log={log}
                  emotion={emotion}
                  index={index}
                  onLogClick={onLogClick}
                  onPhotoClick={handlePhotoClick}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-slate-400 mb-4">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>아직 여행 기록이 없습니다</p>
            <p className="text-sm">지도에서 첫 번째 여행을 기록해보세요!</p>
          </div>
        </motion.div>
      )}

      {/* Photo Slideshow */}
      {selectedLog && (
        <PhotoSlideshow
          photos={selectedLog.photos}
          initialIndex={selectedPhotoIndex}
          isOpen={slideshowOpen}
          onClose={() => setSlideshowOpen(false)}
          placeName={selectedLog.placeName}
        />
      )}
    </div>
  );
}
