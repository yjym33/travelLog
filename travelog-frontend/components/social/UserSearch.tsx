"use client";

import React, { useState } from "react";
import { Search, UserPlus, Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  useSearchUsers,
  useSendFriendRequest,
} from "@/hooks/useFriendshipQueries";

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: searchData, isLoading } = useSearchUsers(debouncedQuery);
  const { mutate: sendRequest, isPending: isSending } = useSendFriendRequest();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  const handleSendRequest = (userId: string, userName: string) => {
    sendRequest(userId, {
      onSuccess: () => {
        alert(`${userName}님에게 친구 요청을 보냈습니다.`);
      },
      onError: (error: any) => {
        alert(error.message || "친구 요청 전송에 실패했습니다.");
      },
    });
  };

  const users = searchData?.data || [];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="이메일 또는 닉네임으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={!searchQuery.trim() || isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>

      {debouncedQuery && users.length === 0 && !isLoading && (
        <div className="text-center py-8 text-slate-500">
          검색 결과가 없습니다.
        </div>
      )}

      {users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback>{user.nickname.slice(0, 2)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{user.nickname}</h4>
                      {user.friendshipStatus === "ACCEPTED" && (
                        <Badge variant="secondary" className="text-xs">
                          친구
                        </Badge>
                      )}
                      {user.friendshipStatus === "PENDING" && (
                        <Badge variant="outline" className="text-xs">
                          {user.isRequester ? "요청 보냄" : "요청 받음"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    {user.friendsCount !== undefined && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <Users className="w-3 h-3" />
                        <span>친구 {user.friendsCount}명</span>
                      </div>
                    )}
                  </div>

                  {!user.friendshipStatus && (
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(user.id, user.nickname)}
                      disabled={isSending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      친구 추가
                    </Button>
                  )}

                  {user.friendshipStatus === "ACCEPTED" && (
                    <Button size="sm" variant="outline" disabled>
                      친구
                    </Button>
                  )}

                  {user.friendshipStatus === "PENDING" && (
                    <Button size="sm" variant="outline" disabled>
                      {user.isRequester ? "요청 중" : "요청 받음"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


