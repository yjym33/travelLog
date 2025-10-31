"use client";

import React from "react";
import { UserCheck, UserMinus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFriendships, useRemoveFriend } from "@/hooks/useFriendshipQueries";
import { useAuthStore } from "@/stores/authStore";

export default function FriendsList() {
  const { user } = useAuthStore();
  const { data: friendsData, isLoading } = useFriendships("ACCEPTED");
  const { mutate: removeFriend, isPending: isRemoving } = useRemoveFriend();

  const handleRemoveFriend = (friendshipId: string, friendName: string) => {
    if (confirm(`${friendName}님을 친구에서 삭제하시겠습니까?`)) {
      removeFriend(friendshipId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const friends = friendsData?.data || [];

  if (friends.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        아직 친구가 없습니다. 사용자를 검색하여 친구를 추가해보세요!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friendship) => {
        const friend =
          friendship.requesterId === user?.id
            ? friendship.addressee
            : friendship.requester;

        return (
          <Card key={friendship.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={friend.profileImage} />
                  <AvatarFallback>{friend.nickname.slice(0, 2)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{friend.nickname}</h4>
                    <UserCheck className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-slate-500">{friend.email}</p>
                  {friend.friendsCount !== undefined && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      친구 {friend.friendsCount}명
                    </Badge>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleRemoveFriend(friendship.id, friend.nickname)
                  }
                  disabled={isRemoving}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <UserMinus className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
