"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/AuthProvider";
import { getOrCreateChat, sendMessage, subscribeToMessages } from "@/lib/chat";
import type { Message } from "@/lib/types";

type Props = {
  chatId: string;
  ownerUid: string;
  ownerName: string;
  route: string;
  listingType: "journey" | "request";
  listingId: string;
  onClose: () => void;
};

export default function ChatModal({
  chatId,
  ownerUid,
  ownerName,
  route,
  listingType,
  listingId,
  onClose,
}: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const myName = user.phoneNumber ?? "User";
    const participants: [string, string] = [ownerUid, user.uid];

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChatReady(false);

    getOrCreateChat(chatId, participants, listingType, listingId, route, {
      [ownerUid]: ownerName,
      [user.uid]: myName,
    }).then(() => {
      if (!cancelled) setChatReady(true);
    }).catch(() => {
      if (!cancelled) setChatReady(true);
    });

    const unsub = subscribeToMessages(chatId, setMessages);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [chatId, user, ownerUid, ownerName, route, listingType, listingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !text.trim() || !chatReady) return;
    setSending(true);
    try {
      await sendMessage(chatId, user.uid, user.phoneNumber ?? "User", text.trim());
      setText("");
    } finally {
      setSending(false);
    }
  };

  const isOwner = user?.uid === ownerUid;
  const otherName = isOwner ? "Passenger" : ownerName;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-xl shadow-2xl flex flex-col"
        style={{ height: "min(600px, 90dvh)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{otherName}</p>
            <p className="text-xs text-gray-500 truncate">{route}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {!chatReady && (
            <div className="flex justify-center mt-8">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {chatReady && messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hello!</p>
          )}
          {messages.map((msg) => {
            const isMe = msg.uid === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 flex gap-2 shrink-0">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={chatReady ? "Type a message..." : "Connecting..."}
            disabled={!chatReady}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || !chatReady}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full w-9 h-9 flex items-center justify-center transition shrink-0"
            aria-label="Send"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
