"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  MapPin,
  Calendar,
  Tag,
  Trash2,
  Upload,
  Share2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TravelLog, Emotion } from "@/types/travel";
import Image from "next/image";
import PhotoSlideshow from "./photo-slideshow";

interface TravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  travelLog: TravelLog | null;
  emotions: Record<string, Emotion>;
  onSave: (log: TravelLog) => void;
  onDelete: (id: string) => void;
  onShare?: () => void;
}

export default function TravelModal({
  isOpen,
  onClose,
  travelLog,
  emotions,
  onSave,
  onDelete,
  onShare,
}: TravelModalProps) {
  const [formData, setFormData] = useState<TravelLog>({
    id: "",
    userId: "",
    lat: 0,
    lng: 0,
    placeName: "",
    country: "",
    emotion: "happy",
    photos: [],
    diary: "",
    tags: [],
    createdAt: "",
  });
  const [newTag, setNewTag] = useState("");
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (travelLog) {
      setFormData(travelLog);
    }
  }, [travelLog]);

  const handleSave = () => {
    if (!formData.placeName.trim()) return;
    onSave(formData);
  };

  const handleDelete = () => {
    if (formData.id && window.confirm("이 여행 기록을 삭제하시겠습니까?")) {
      onDelete(formData.id);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArr = Array.from(files);
    fileArr.forEach((file) => {
      const url = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, url],
      }));
    });
    e.target.value = "";
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Card className="bg-slate-900 border-slate-700">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    {formData.id ? "여행 기록 수정" : "새로운 여행 기록"}
                  </h2>
                  <div className="flex items-center gap-2">
                    {formData.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Place Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      장소명
                    </label>
                    <Input
                      value={formData.placeName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          placeName: e.target.value,
                        }))
                      }
                      placeholder="여행한 장소를 입력하세요"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>

                  {/* Emotion Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      감정 선택
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(emotions).map(([key, emotion]) => (
                        <motion.button
                          key={key}
                          type="button"
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.emotion === key
                              ? "border-white bg-slate-700"
                              : "border-slate-600 bg-slate-800 hover:border-slate-500"
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, emotion: key }))
                          }
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">{emotion.emoji}</div>
                            <div className="text-xs text-slate-300">
                              {emotion.label}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Photos */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">
                        <Camera className="w-4 h-4 inline mr-1" />
                        사진
                      </label>
                      {formData.photos.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPhotoIndex(0);
                            setSlideshowOpen(true);
                          }}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          <Maximize2 className="w-4 h-4 mr-1" />
                          전체화면
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {formData.photos.map((photo, index) => (
                        <motion.div
                          key={index}
                          className="relative group cursor-pointer"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => {
                            setSelectedPhotoIndex(index);
                            setSlideshowOpen(true);
                          }}
                        >
                          <Image
                            src={photo || "/placeholder.svg"}
                            alt={`Photo ${index + 1}`}
                            width={200}
                            height={150}
                            className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center rounded-lg">
                            <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500/80 hover:bg-red-500 text-white z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(index);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePhotoUpload}
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      사진 추가
                    </Button>
                  </div>

                  {/* Diary */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      여행 일기
                    </label>
                    <Textarea
                      value={formData.diary}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          diary: e.target.value,
                        }))
                      }
                      placeholder="이곳에서의 감정과 경험을 자유롭게 적어보세요..."
                      rows={4}
                      className="bg-slate-800 border-slate-600 text-white resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      태그
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-slate-700 text-slate-200 hover:bg-slate-600"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="태그 입력 (예: #카페, #혼자여행)"
                        className="bg-slate-800 border-slate-600 text-white"
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        className="bg-slate-700 hover:bg-slate-600"
                      >
                        추가
                      </Button>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      날짜
                    </label>
                    <Input
                      type="date"
                      value={formData.createdAt}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          createdAt: e.target.value,
                        }))
                      }
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {/* Share Section - Only for existing logs */}
                {formData.id && onShare && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <Button
                      variant="outline"
                      onClick={onShare}
                      className="w-full border-purple-500/30 hover:bg-purple-500/10"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      여행 공유하기
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-8">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="text-slate-400 hover:text-white"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.placeName.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {formData.id ? "수정" : "저장"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Photo Slideshow */}
      <PhotoSlideshow
        photos={formData.photos}
        initialIndex={selectedPhotoIndex}
        isOpen={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        placeName={formData.placeName}
      />
    </AnimatePresence>
  );
}
