"use client";

import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleTravelLogLike } from "@/hooks/useLikeQueries";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  travelLogId: string;
  isLiked: boolean;
  likeCount: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export default function LikeButton({
  travelLogId,
  isLiked,
  likeCount,
  size = "md",
  showCount = true,
}: LikeButtonProps) {
  const { mutate: toggleLike, isPending } = useToggleTravelLogLike();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike({ travelLogId, currentLiked: isLiked });
  };

  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-9 text-sm",
    lg: "h-10 text-base",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size="sm"
      className={cn(
        "gap-2 transition-all duration-200",
        sizeClasses[size],
        isLiked && "bg-red-500 hover:bg-red-600 text-white",
        isPending && "opacity-50 cursor-not-allowed"
      )}
      onClick={handleLike}
      disabled={isPending}
    >
      <Heart
        className={cn("transition-all duration-200", isLiked && "fill-current")}
        size={iconSizes[size]}
      />
      {showCount && <span>{likeCount}</span>}
    </Button>
  );
}
