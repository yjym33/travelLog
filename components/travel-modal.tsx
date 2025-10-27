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
  Brain,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type {
  TravelLog,
  CreateTravelRequest,
  UpdateTravelRequest,
} from "@/types/travel";
import { travelApi, uploadApi, aiApi } from "@/lib/api";
import { imageAnalysisService } from "@/lib/imageAnalysis";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import PhotoSlideshow from "./photo-slideshow";

interface TravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  travelLog: TravelLog | null;
  emotions: Record<string, { color: string; emoji: string; label: string }>;
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
  const { token } = useAuth();
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
    updatedAt: "",
  });
  const [newTag, setNewTag] = useState("");
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // 도시명 검색을 위한 상태
  const [citySearch, setCitySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // AI 분석을 위한 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedEmotion, setSuggestedEmotion] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (travelLog) {
      setFormData(travelLog);
    }
  }, [travelLog]);

  // 도시명으로 좌표 검색하는 함수
  const searchCityCoordinates = async (cityName: string) => {
    if (!cityName.trim()) return;

    setIsSearching(true);
    try {
      // OpenStreetMap Nominatim API 사용
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          cityName
        )}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setFormData((prev) => ({
          ...prev,
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          placeName: prev.placeName || cityName,
          country: prev.country || display_name.split(", ").pop() || "",
        }));
        console.log("도시 검색 성공:", { cityName, lat, lon, display_name });
      } else {
        console.log("도시를 찾을 수 없습니다:", cityName);
        alert("해당 도시를 찾을 수 없습니다. 다른 이름으로 시도해보세요.");
      }
    } catch (error) {
      console.error("도시 검색 실패:", error);
      alert("도시 검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  // AI 이미지 분석 함수 (자체 구현)
  const analyzeImage = async (imageUrl: string) => {
    if (!token) return;

    setIsAnalyzing(true);
    setAiError(null);
    setAnalysisProgress(0);

    try {
      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      console.log("이미지 분석 시작:", imageUrl);

      // 자체 AI 분석 서비스 사용
      const result = await imageAnalysisService.analyzeImage(imageUrl);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (result && result.tags && result.tags.length > 0) {
        setSuggestedTags(result.tags);
        console.log("자체 AI 태그 생성 성공:", result.tags);
      } else {
        console.warn("AI 분석 결과가 비어있음, 기본 태그 사용");
        setSuggestedTags(["#여행", "#추억", "#기록"]);
      }

      // 성공 메시지 표시
      setTimeout(() => {
        setAnalysisProgress(0);
      }, 1000);
    } catch (error) {
      console.error("이미지 분석 실패:", error);

      // 에러 타입에 따른 구체적인 메시지
      let errorMessage = "이미지 분석 중 오류가 발생했습니다.";
      if (error instanceof Error) {
        if (error.message.includes("모델")) {
          errorMessage =
            "AI 모델 로딩에 실패했습니다. 메타데이터 분석을 시도합니다.";
        } else if (error.message.includes("이미지")) {
          errorMessage = "이미지 로딩에 실패했습니다. URL을 확인해주세요.";
        } else {
          errorMessage = error.message;
        }
      }

      setAiError(errorMessage);
      setAnalysisProgress(0);

      // 폴백: 기본 태그라도 제공
      setSuggestedTags(["#여행", "#추억", "#기록"]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI 감정 분석 함수
  const analyzeEmotion = async (text: string) => {
    if (!token || text.length < 10) return;

    try {
      const result = await aiApi.analyzeEmotion(token, text);
      if (result.success) {
        setSuggestedEmotion(result.emotion);
        console.log("AI 감정 분석:", result.emotion, result.confidence);
      } else {
        throw new Error(result.message || "감정 분석에 실패했습니다.");
      }
    } catch (error) {
      console.error("감정 분석 실패:", error);
      setAiError(
        error instanceof Error
          ? error.message
          : "감정 분석 중 오류가 발생했습니다."
      );
    }
  };

  // AI 제안 태그 추가
  const addSuggestedTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  // AI 제안 감정 적용
  const applySuggestedEmotion = () => {
    if (suggestedEmotion) {
      setFormData((prev) => ({
        ...prev,
        emotion: suggestedEmotion,
      }));
      setSuggestedEmotion(null);
    }
  };

  // AI 에러 초기화
  const clearAiError = () => {
    setAiError(null);
  };

  const handleSave = async () => {
    if (!formData.placeName.trim() || !token) return;

    setIsLoading(true);
    try {
      if (formData.id) {
        // 수정
        const updateData: UpdateTravelRequest = {
          placeName: formData.placeName,
          country: formData.country,
          emotion: formData.emotion,
          photos: formData.photos,
          diary: formData.diary,
          tags: formData.tags,
        };
        const updatedLog = await travelApi.update(
          token,
          formData.id,
          updateData
        );
        onSave(updatedLog);
      } else {
        // 생성
        const createData: CreateTravelRequest = {
          lat: formData.lat,
          lng: formData.lng,
          placeName: formData.placeName,
          country: formData.country,
          emotion: formData.emotion,
          photos: formData.photos,
          diary: formData.diary,
          tags: formData.tags,
        };
        const newLog = await travelApi.create(token, createData);
        onSave(newLog);
      }
      onClose();
    } catch (error) {
      console.error("여행 기록 저장 실패:", error);
      alert("여행 기록 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !formData.id ||
      !token ||
      !window.confirm("이 여행 기록을 삭제하시겠습니까?")
    )
      return;

    setIsLoading(true);
    try {
      await travelApi.delete(token, formData.id);
      onDelete(formData.id);
      onClose();
    } catch (error) {
      console.error("여행 기록 삭제 실패:", error);
      alert("여행 기록 삭제에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !token) return;

    // 파일 크기 제한 체크 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = Array.from(files).filter(
      (file) => file.size > maxSize
    );

    if (oversizedFiles.length > 0) {
      alert(
        `파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.\n큰 파일: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`
      );
      e.target.value = "";
      return;
    }

    setUploadingPhotos(true);
    try {
      const fileArr = Array.from(files);
      console.log(
        "Starting upload for files:",
        fileArr.map((f) => ({ name: f.name, size: f.size }))
      );

      const uploadPromises = fileArr.map((file) =>
        uploadApi.uploadSingle(token, file)
      );
      const uploadResults = await Promise.all(uploadPromises);

      console.log("Upload results:", uploadResults);

      const newPhotoUrls = uploadResults.map((result) => result.url);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotoUrls],
      }));

      // 첫 번째 사진에 대해 AI 분석 실행
      if (newPhotoUrls.length > 0) {
        await analyzeImage(newPhotoUrls[0]);
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);

      let errorMessage = "이미지 업로드에 실패했습니다.";
      if (error instanceof Error) {
        if (error.message.includes("서버에 연결할 수 없습니다")) {
          errorMessage =
            "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.";
        } else if (error.message.includes("CORS")) {
          errorMessage =
            "CORS 오류가 발생했습니다. 브라우저를 새로고침하거나 다른 브라우저를 시도해주세요.";
        } else if (error.message.includes("413")) {
          errorMessage =
            "파일 크기가 너무 큽니다. 더 작은 파일을 선택해주세요.";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.";
        } else {
          errorMessage = `업로드 실패: ${error.message}`;
        }
      }

      alert(errorMessage);
    } finally {
      setUploadingPhotos(false);
      e.target.value = "";
    }
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
                  {/* 도시명 검색 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      도시명 검색 (좌표 자동 설정)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        placeholder="예: 서울, Tokyo, New York, 파리"
                        className="bg-slate-800 border-slate-600 text-white"
                        onKeyPress={(e) =>
                          e.key === "Enter" && searchCityCoordinates(citySearch)
                        }
                      />
                      <Button
                        onClick={() => searchCityCoordinates(citySearch)}
                        disabled={isSearching || !citySearch.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSearching ? "검색 중..." : "검색"}
                      </Button>
                    </div>
                  </div>

                  {/* 좌표 직접 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      좌표 직접 입력
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          위도 (Latitude)
                        </label>
                        <Input
                          type="number"
                          step="any"
                          value={formData.lat || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lat: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="37.5665"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          경도 (Longitude)
                        </label>
                        <Input
                          type="number"
                          step="any"
                          value={formData.lng || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lng: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="126.9780"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 장소명 */}
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
                      {formData.photos?.map((photo, index) => (
                        <motion.div
                          key={`photo-${index}-${photo.split("/").pop()}`}
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
                      disabled={uploadingPhotos}
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPhotos ? "업로드 중..." : "사진 추가"}
                    </Button>
                  </div>

                  {/* Diary */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      여행 일기
                    </label>
                    <Textarea
                      value={formData.diary}
                      onChange={(e) => {
                        const newDiary = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          diary: newDiary,
                        }));

                        // 일기 텍스트가 충분할 때 AI 감정 분석 실행
                        if (newDiary.length >= 10) {
                          analyzeEmotion(newDiary);
                        }
                      }}
                      placeholder="이곳에서의 감정과 경험을 자유롭게 적어보세요..."
                      rows={4}
                      className="bg-slate-800 border-slate-600 text-white resize-none"
                    />
                  </div>

                  {/* AI 분석 상태 표시 */}
                  {(isAnalyzing || aiError) && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">
                          AI 분석 중
                        </span>
                        {isAnalyzing && (
                          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        )}
                      </div>

                      {isAnalyzing && analysisProgress > 0 && (
                        <div className="mb-3">
                          <Progress
                            value={analysisProgress}
                            className="h-2 bg-purple-900/30"
                          />
                          <p className="text-xs text-purple-200 mt-1">
                            이미지를 분석하고 있습니다... {analysisProgress}%
                          </p>
                        </div>
                      )}

                      {aiError && (
                        <div className="flex items-center justify-between text-red-300">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">{aiError}</span>
                          </div>
                          <Button
                            onClick={clearAiError}
                            size="sm"
                            variant="ghost"
                            className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI 제안 감정 */}
                  {suggestedEmotion &&
                    suggestedEmotion !== formData.emotion && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-300">
                              AI 감정 제안
                            </span>
                          </div>
                          <Button
                            onClick={applySuggestedEmotion}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            적용
                          </Button>
                        </div>
                        <p className="text-sm text-blue-200">
                          일기를 분석한 결과{" "}
                          <strong>{emotions[suggestedEmotion]?.label}</strong>{" "}
                          감정이 더 적합해 보입니다.
                        </p>
                      </div>
                    )}

                  {/* AI 제안 태그 */}
                  {suggestedTags.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-green-300">
                            AI 태그 제안 ({suggestedTags.length}개)
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            suggestedTags.forEach((tag) =>
                              addSuggestedTag(tag)
                            );
                            setSuggestedTags([]);
                          }}
                          size="sm"
                          variant="outline"
                          className="bg-green-600/20 border-green-500/50 text-green-200 hover:bg-green-600/30"
                        >
                          모두 추가
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTags.map((tag, index) => (
                          <Button
                            key={`suggested-tag-${index}-${tag.replace(
                              "#",
                              ""
                            )}`}
                            onClick={() => addSuggestedTag(tag)}
                            size="sm"
                            variant="outline"
                            className="bg-green-600/20 border-green-500/50 text-green-200 hover:bg-green-600/30 transition-all duration-200 hover:scale-105"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-green-200 mt-2">
                        💡 클릭하여 태그를 추가하거나 "모두 추가" 버튼으로 한
                        번에 추가할 수 있습니다.
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      태그
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags?.map((tag, index) => (
                        <Badge
                          key={`tag-${index}-${tag.replace("#", "")}`}
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

                  {/* 지도 미리보기 */}
                  {formData.lat !== 0 && formData.lng !== 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        위치 미리보기
                      </label>
                      <div className="w-full h-48 bg-slate-800 rounded-lg overflow-hidden border border-slate-600">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                            formData.lng - 0.01
                          },${formData.lat - 0.01},${formData.lng + 0.01},${
                            formData.lat + 0.01
                          }&layer=mapnik&marker=${formData.lat},${
                            formData.lng
                          }`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          title="위치 미리보기"
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        좌표: {formData.lat.toFixed(6)},{" "}
                        {formData.lng.toFixed(6)}
                      </div>
                    </div>
                  )}
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
                    disabled={!formData.placeName.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                  >
                    {isLoading ? "저장 중..." : formData.id ? "수정" : "저장"}
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
