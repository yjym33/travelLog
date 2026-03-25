"use client";

import React from "react";
import { Loader2, Inbox } from "lucide-react";
import { useReceivedFriendRequests } from "@/hooks/useFriendshipQueries";
import FriendRequestCard from "./FriendRequestCard";

export default function FriendRequestsList() {
  const { data: requestsData, isLoading } = useReceivedFriendRequests();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const requests = requestsData?.data || [];

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Inbox className="w-12 h-12 mb-3 text-slate-400" />
        <p>받은 친구 요청이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <FriendRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}
