"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTravelFeed } from "@/hooks/useSocialTravelQueries";
import LikeButton from "@/components/social/LikeButton";
import CommentSection from "@/components/social/CommentSection";

export default function SocialTestPage() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useTravelFeed();
  const logs = data?.pages?.flatMap((p) => p.data) ?? [];

  if (isLoading) return <div className="p-6">피드를 불러오는 중...</div>;
  if (logs.length === 0)
    return (
      <div className="p-6">피드가 비어있습니다. 여행 기록을 추가해보세요.</div>
    );

  const log = logs[0];

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">{log.placeName}</div>
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
      </Card>

      <Card className="p-6">
        <CommentSection travelLogId={log.id} commentCount={log.commentCount} />
      </Card>

      {hasNextPage && (
        <button
          className="px-4 py-2 rounded bg-slate-700 text-white"
          onClick={() => fetchNextPage()}
        >
          더 보기
        </button>
      )}
    </div>
  );
}
