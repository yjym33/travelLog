"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Inbox, Share2 } from "lucide-react";
import TravelFeed from "./TravelFeed";
import FriendsList from "./FriendsList";
import UserSearch from "./UserSearch";
import FriendRequestsList from "./FriendRequestsList";
import {
  useReceivedFriendRequests,
  useFriendships,
} from "@/hooks/useFriendshipQueries";

export default function SocialHub() {
  const { data: requestsData } = useReceivedFriendRequests();
  const { data: friendsData } = useFriendships("ACCEPTED");

  const pendingRequestsCount = requestsData?.data?.length || 0;
  const friendsCount = friendsData?.data?.length || 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">피드</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">친구</span>
              {friendsCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {friendsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">검색</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">요청</span>
              {pendingRequestsCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {pendingRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">여행 피드</h2>
              <p className="text-sm text-slate-500 mb-4">
                친구들의 여행 기록과 공개된 여행 이야기를 확인하세요.
              </p>
              <TravelFeed />
            </div>
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-4">내 친구 목록</h2>
              <p className="text-sm text-slate-500 mb-4">
                현재 연결된 친구들의 목록입니다.
              </p>
              <FriendsList />
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-4">사용자 검색</h2>
              <p className="text-sm text-slate-500 mb-4">
                이메일 또는 닉네임으로 다른 사용자를 찾아 친구를 추가하세요.
              </p>
              <UserSearch />
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-4">
                받은 친구 요청
                {pendingRequestsCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingRequestsCount}
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                다른 사용자로부터 받은 친구 요청을 확인하고 수락/거절하세요.
              </p>
              <FriendRequestsList />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}


