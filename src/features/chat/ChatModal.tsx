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
  const [firstSent, setFirstSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [visH, setVisH] = useState(0);

  useEffect(() => {
    if (!user) return;

    const myName = "Rider";
    const participants: [string, string] = [ownerUid, user.uid];

    let cancelled = false;
    let unsubMessages: (() => void) | null = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChatReady(false);

    getOrCreateChat(chatId, participants, listingType, listingId, route, {
      [ownerUid]: ownerName,
      [user.uid]: myName,
    }).then(() => {
      if (cancelled) return;
      setChatReady(true);
      unsubMessages = subscribeToMessages(chatId, setMessages);
    }).catch(() => {
      if (!cancelled) setChatReady(true);
    });

    return () => {
      cancelled = true;
      unsubMessages?.();
    };
  }, [chatId, user, ownerUid, ownerName, route, listingType, listingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Push modal above soft keyboard on mobile
  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      const h = vv?.height ?? window.innerHeight;
      setVisH(h);
      setBottomOffset(Math.max(0, window.innerHeight - h - (vv?.offsetTop ?? 0)));
    };
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  const handleSend = async () => {
    if (!user || !text.trim() || !chatReady) return;
    setSending(true);
    const msgText = text.trim();
    try {
      await sendMessage(chatId, user.uid, "Rider", msgText);
      setText("");
      setFirstSent(true);
      // Fire-and-forget push notification to the other participant
      user.getIdToken().then((token) =>
        fetch("/api/notify", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, text: msgText, senderName: "Rider" }),
        })
      ).catch(() => {});
    } finally {
      setSending(false);
    }
  };

  const isOwner = user?.uid === ownerUid;
  const otherName = isOwner ? "Passenger" : ownerName;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ paddingBottom: `max(${bottomOffset}px, env(safe-area-inset-bottom, 0px))` }}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: visH > 0 ? `min(600px, ${Math.floor(visH * 0.9)}px)` : "min(600px, 90dvh)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg transition -ml-1"
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-2">
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
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
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

        {/* Sent tip */}
        {firstSent && messages.length <= 2 && (
          <div className="mx-3 mb-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 text-center shrink-0">
            Message sent! The other person will see it in their <strong>Messages</strong> tab when they open the app.
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 flex gap-2 items-center shrink-0">
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
            className="flex-1 min-w-0 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            style={{ fontSize: '16px' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sending || !chatReady}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full w-11 h-11 flex items-center justify-center transition shrink-0"
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
