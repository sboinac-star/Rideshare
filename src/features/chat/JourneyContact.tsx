"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/AuthProvider";
import SignInModal from "@/app/SignInModal";
import ChatModal from "@/features/chat/ChatModal";
import { buildChatId } from "@/lib/chat";

type Props = {
  journeyId: string;
  ownerUid: string;
  driverName: string;
  route: string;
};

export default function JourneyContact({ journeyId, ownerUid, driverName, route }: Props) {
  const { user, authLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!user || user.uid === ownerUid) return;
    user.getIdToken().then((token) =>
      fetch(`/api/block?blockedUid=${ownerUid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d: { blocked: boolean }) => setIsBlocked(d.blocked))
        .catch(() => {})
    );
  }, [user, ownerUid]);

  if (authLoading) return null;

  const isOwner = user?.uid === ownerUid;

  const chatId = user ? buildChatId("journey", journeyId, user.uid, ownerUid) : "";

  const handleChat = () => {
    if (!user) {
      setShowSignIn(true);
    } else {
      setShowChat(true);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-5">
      {isOwner ? (
        <p className="text-center text-gray-500 text-sm">This is your journey.</p>
      ) : isBlocked ? (
        <p className="text-center text-gray-400 text-sm">You have blocked this driver.</p>
      ) : (
        <>
          <p className="text-center text-gray-500 text-sm mb-3">
            Message the driver to book your seat
          </p>
          <button
            onClick={handleChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            💬 Chat with Driver
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Negotiate price and pickup details in-app.
          </p>
        </>
      )}

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSuccess={() => setShowChat(true)}
          title="Sign in to chat"
        />
      )}

      {showChat && user && (
        <ChatModal
          chatId={chatId}
          ownerUid={ownerUid}
          ownerName={driverName}
          route={route}
          listingType="journey"
          listingId={journeyId}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
