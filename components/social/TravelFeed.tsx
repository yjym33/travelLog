"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTravelFeed } from "@/hooks/useSocialTravelQueries";
import LikeButton from "@/components/social/LikeButton";
import CommentSection from "@/components/social/CommentSection";

export default function TravelFeed() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useTravelFeed();
  const logs = data?.pages?.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">피드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {logs.length === 0 && (
        <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">피드가 비어있습니다</h3>
          <p className="text-slate-500 mb-4">
            친구를 추가하고 여행 기록을 공개해보세요!
          </p>
          <div className="flex gap-2 justify-center text-sm text-slate-600">
            <span>💡 친구 추가는 &quot;검색&quot; 탭에서 할 수 있습니다</span>
          </div>
        </div>
      )}

      {logs.map((log) => (
        <Card key={log.id} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={log.user.profileImage} />
                <AvatarFallback>{log.user.nickname.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{log.user.nickname}</div>
                <div className="text-xs text-slate-500">{log.placeName}</div>
              </div>
            </div>
            <Badge>{log.country}</Badge>
          </div>

          <div className="text-slate-500">감정: {log.emotion}</div>

          <div className="flex items-center gap-4">
            <LikeButton
              travelLogId={log.id}
              isLiked={log.isLikedByMe ?? false}
              likeCount={log.likeCount}
            />
            <div className="text-sm text-slate-500">
              조회수 {log.viewCount} · 댓글 {log.commentCount}
            </div>
          </div>

          <div className="text-sm whitespace-pre-wrap">{log.diary}</div>

          <CommentSection
            travelLogId={log.id}
            commentCount={log.commentCount}
          />
        </Card>
      ))}

      {hasNextPage && logs.length > 0 && (
        <div className="flex justify-center">
          <button
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all shadow-md hover:shadow-lg"
            onClick={() => fetchNextPage()}
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}


