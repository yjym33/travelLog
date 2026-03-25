"use client";

import React from "react";
import { Check, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from "@/hooks/useFriendshipQueries";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { FriendRequest } from "@/types/social";

interface FriendRequestCardProps {
  request: FriendRequest;
}

export default function FriendRequestCard({ request }: FriendRequestCardProps) {
  const { mutate: acceptRequest, isPending: isAccepting } =
    useAcceptFriendRequest();
  const { mutate: rejectRequest, isPending: isRejecting } =
    useRejectFriendRequest();

  const handleAccept = () => {
    acceptRequest(request.id);
  };

  const handleReject = () => {
    rejectRequest(request.id);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={request.requester.profileImage} />
            <AvatarFallback>
              {request.requester.nickname.slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{request.requester.nickname}</h4>
              <UserPlus className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-sm text-slate-500">{request.requester.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              {formatDistanceToNow(new Date(request.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              수락
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isAccepting || isRejecting}
            >
              <X className="w-4 h-4 mr-1" />
              거절
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
