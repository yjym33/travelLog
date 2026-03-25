"use client";

import React, { useState } from "react";
import { MessageCircle, Send, Edit2, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/useCommentQueries";
import { useToggleCommentLike } from "@/hooks/useLikeQueries";
import { useAuthStore } from "@/stores/authStore";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment } from "@/types/social";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  travelLogId: string;
  commentCount: number;
}

export default function CommentSection({
  travelLogId,
  commentCount,
}: CommentSectionProps) {
  const { user } = useAuthStore();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: commentsData, isLoading } = useComments(travelLogId);
  const { mutate: createComment, isPending: isCreating } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: toggleCommentLike } = useToggleCommentLike();

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;

    createComment(
      {
        travelLogId,
        content: commentText,
        parentId: replyingTo || undefined,
      },
      {
        onSuccess: () => {
          setCommentText("");
          setReplyingTo(null);
        },
      }
    );
  };

  const handleDeleteComment = (commentId: string, parentId?: string) => {
    if (confirm("댓글을 삭제하시겠습니까?")) {
      deleteComment({ commentId, travelLogId, parentId });
    }
  };

  const handleLikeComment = (commentId: string) => {
    toggleCommentLike({ commentId, travelLogId });
  };

  const CommentItem = ({ comment }: { comment: Comment }) => {
    const isMyComment = user?.id === comment.userId;

    return (
      <div className="flex gap-3 mb-4">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user.profileImage} />
          <AvatarFallback>{comment.user.nickname.slice(0, 2)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">
                {comment.user.nickname}
              </span>
              {isMyComment && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() =>
                      handleDeleteComment(comment.id, comment.parentId)
                    }
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {comment.isDeleted ? (
              <p className="text-sm text-slate-500 italic">
                삭제된 댓글입니다.
              </p>
            ) : (
              <p className="text-sm">{comment.content}</p>
            )}

            {comment.isEdited && (
              <Badge variant="secondary" className="mt-1 text-xs">
                수정됨
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
            {!comment.isDeleted && (
              <>
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={cn(
                    "flex items-center gap-1 hover:text-red-600 transition-colors",
                    comment.isLikedByMe && "text-red-600"
                  )}
                >
                  <Heart
                    className={cn(
                      "w-3 h-3",
                      comment.isLikedByMe && "fill-current"
                    )}
                  />
                  {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                </button>
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="hover:text-purple-600"
                >
                  답글
                </button>
              </>
            )}
          </div>

          {/* 대댓글 표시 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 ml-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <h3 className="font-semibold">댓글 {commentCount}</h3>
      </div>

      {/* 댓글 입력 */}
      <div className="flex gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.profileImage} />
          <AvatarFallback>{user?.nickname.slice(0, 2)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          {replyingTo && (
            <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
              <span className="text-sm">답글 작성 중...</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                취소
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="resize-none"
              rows={2}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isCreating}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">
          댓글을 불러오는 중...
        </div>
      ) : commentsData && commentsData.data.length > 0 ? (
        <div className="space-y-4">
          {commentsData.data.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          첫 댓글을 작성해보세요!
        </div>
      )}
    </div>
  );
}
