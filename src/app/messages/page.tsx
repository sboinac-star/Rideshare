"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/AuthProvider";
import SignInModal from "@/app/SignInModal";
import ChatModal from "@/app/ChatModal";
import { subscribeToUserChats, buildChatId } from "@/lib/chat";
import type { Chat } from "@/lib/types";

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MessagesPage() {
  const { user, authLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [openChat, setOpenChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToUserChats(user.uid, (data) => {
      setChats(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Your Messages</p>
          <p className="text-gray-500 mb-6">Sign in to view your conversations.</p>
          <button
            onClick={() => setShowSignIn(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Sign In
          </button>
        </div>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No conversations yet.</p>
            <Link href="/" className="text-blue-600 hover:underline font-medium">
              Browse rides to start chatting
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => {
              const otherUid = chat.participants.find((p) => p !== user.uid) ?? "";
              const otherName = chat.participantNames[otherUid] ?? "User";
              const isOwner = user.uid === chat.participants[0] && chat.participants[0] !== chat.participants[1]
                ? false // simplified; owner is whoever posted the listing
                : false;
              // The chat ID encodes who initiated: listingType_listingId_initiatorUid
              // If user.uid is the initiator, otherUid is the listing owner
              const chatIdForModal = buildChatId(chat.listingType, chat.listingId,
                chat.participants.find(p => p !== user.uid) === chat.participants[0] ? user.uid : chat.id.split("_").slice(-1)[0]
              );
              void isOwner;

              return (
                <button
                  key={chat.id}
                  onClick={() => setOpenChat(chat)}
                  className="w-full bg-white rounded-xl p-4 hover:shadow-md transition text-left flex gap-3 items-start"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg shrink-0">
                    {chat.listingType === "journey" ? "🚗" : "🙋"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">{otherName}</p>
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(chat.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{chat.route}</p>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate mt-0.5">{chat.lastMessage}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openChat && user && (() => {
        const otherUid = openChat.participants.find((p) => p !== user.uid) ?? openChat.participants[0];
        const otherName = openChat.participantNames[otherUid] ?? "User";
        return (
          <ChatModal
            chatId={openChat.id}
            ownerUid={otherUid}
            ownerName={otherName}
            route={openChat.route}
            listingType={openChat.listingType}
            listingId={openChat.listingId}
            onClose={() => setOpenChat(null)}
          />
        );
      })()}
    </div>
  );
}
