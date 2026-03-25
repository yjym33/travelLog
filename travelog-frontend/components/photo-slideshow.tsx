"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PhotoSlideshowProps {
  photos: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  placeName?: string;
}

export default function PhotoSlideshow({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  placeName,
}: PhotoSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  // 키보드 단축키
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setZoom(1);
    setIsZoomed(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setZoom(1);
    setIsZoomed(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
    if (zoom <= 1.5) setIsZoomed(false);
  };

  const handleDownload = async () => {
    const photo = photos[currentIndex];
    try {
      const response = await fetch(photo);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${placeName || "photo"}-${currentIndex + 1}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (!isOpen || photos.length === 0) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-lg font-semibold">{placeName}</h3>
                <p className="text-sm text-slate-300">
                  {currentIndex + 1} / {photos.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/10"
                >
                  <Download className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Image */}
          <div className="absolute inset-0 flex items-center justify-center p-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: zoom }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`relative max-w-full max-h-full ${
                  isZoomed ? "cursor-move" : "cursor-default"
                }`}
                style={{
                  transformOrigin: "center center",
                }}
              >
                <Image
                  src={photos[currentIndex]}
                  alt={`Photo ${currentIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-center gap-4">
              {/* Zoom Controls */}
              <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  className="text-white hover:bg-white/10 w-8 h-8"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-white text-sm w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="text-white hover:bg-white/10 w-8 h-8"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              {/* Thumbnails */}
              <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 max-w-md overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setZoom(1);
                      setIsZoomed(false);
                    }}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all ${
                      index === currentIndex
                        ? "ring-2 ring-white scale-110"
                        : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center">
            <p className="text-xs text-slate-400">
              키보드 단축키: ← → 사진 이동 | ESC 닫기
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
