"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  X,
  Instagram,
  Twitter,
  Facebook,
  Link as LinkIcon,
  Download,
  BookOpen,
  Lock,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { TravelLog } from "@/types/travel";
import type { ShareSettings } from "@/types/share";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  travelLog: TravelLog | null;
  onGenerateImage: (platform: string) => void;
  onExportPDF: () => void;
  onCreateStory: () => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  travelLog,
  onGenerateImage,
  onExportPDF,
  onCreateStory,
}: ShareModalProps) {
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    showLocation: "country",
    showPhotos: true,
    allowComments: true,
  });
  const [copied, setCopied] = useState(false);

  if (!travelLog) return null;

  const shareUrl = `https://travelog.app/travel/${travelLog.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
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
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">
                      여행 공유하기
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Travel Info */}
                <Card className="bg-slate-800/50 border-slate-700 p-4 mb-6">
                  <div className="flex items-start gap-4">
                    {travelLog.photos[0] && (
                      <img
                        src={travelLog.photos[0]}
                        alt={travelLog.placeName}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">
                        {travelLog.placeName}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {travelLog.country} · {travelLog.createdAt}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {travelLog.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-slate-700 text-slate-300"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="space-y-6">
                  {/* Share Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3">
                      공개 설정
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {shareSettings.isPublic ? (
                            <Globe className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {shareSettings.isPublic ? "공개" : "비공개"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {shareSettings.isPublic
                                ? "모든 사용자가 볼 수 있습니다"
                                : "나만 볼 수 있습니다"}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={shareSettings.isPublic}
                          onCheckedChange={(checked) =>
                            setShareSettings({
                              ...shareSettings,
                              isPublic: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-white">
                            사진 표시
                          </div>
                        </div>
                        <Switch
                          checked={shareSettings.showPhotos}
                          onCheckedChange={(checked) =>
                            setShareSettings({
                              ...shareSettings,
                              showPhotos: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Share to Social Media */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3">
                      SNS 공유
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => onGenerateImage("instagram")}
                        className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                      >
                        <Instagram className="w-6 h-6 text-purple-400 mb-2" />
                        <div className="text-sm font-medium text-white">
                          Instagram
                        </div>
                        <div className="text-xs text-slate-400">
                          스토리용 이미지
                        </div>
                      </button>

                      <button
                        onClick={() => onGenerateImage("twitter")}
                        className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg hover:from-blue-500/30 hover:to-blue-600/30 transition-all"
                      >
                        <Twitter className="w-6 h-6 text-blue-400 mb-2" />
                        <div className="text-sm font-medium text-white">
                          Twitter
                        </div>
                        <div className="text-xs text-slate-400">트윗 카드</div>
                      </button>

                      <button
                        onClick={() => onGenerateImage("facebook")}
                        className="p-4 bg-gradient-to-br from-blue-400/20 to-blue-500/20 border border-blue-400/30 rounded-lg hover:from-blue-400/30 hover:to-blue-500/30 transition-all"
                      >
                        <Facebook className="w-6 h-6 text-blue-300 mb-2" />
                        <div className="text-sm font-medium text-white">
                          Facebook
                        </div>
                        <div className="text-xs text-slate-400">
                          페이스북 포스트
                        </div>
                      </button>

                      <button
                        onClick={handleCopyLink}
                        className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg hover:from-green-500/30 hover:to-green-600/30 transition-all"
                      >
                        {copied ? (
                          <Check className="w-6 h-6 text-green-400 mb-2" />
                        ) : (
                          <LinkIcon className="w-6 h-6 text-green-400 mb-2" />
                        )}
                        <div className="text-sm font-medium text-white">
                          {copied ? "복사됨!" : "링크 복사"}
                        </div>
                        <div className="text-xs text-slate-400">
                          URL 공유하기
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Additional Actions */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3">
                      추가 작업
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={onExportPDF}
                        className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-pink-400" />
                          <div>
                            <div className="text-sm font-medium text-white">
                              PDF 다운로드
                            </div>
                            <div className="text-xs text-slate-400">
                              인쇄 가능한 여행 앨범으로 저장
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={onCreateStory}
                        className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="text-sm font-medium text-white">
                              스토리 만들기
                            </div>
                            <div className="text-xs text-slate-400">
                              여러 여행을 하나의 스토리로 연결
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Share URL */}
                  {shareSettings.isPublic && (
                    <div>
                      <h3 className="text-sm font-medium text-white mb-3">
                        공유 링크
                      </h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300"
                        />
                        <Button
                          size="sm"
                          onClick={handleCopyLink}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
