"use client";

import { useState } from "react";
import { useAuth } from "@/app/AuthProvider";
import SignInModal from "@/app/SignInModal";
import ChatModal from "@/features/chat/ChatModal";
import { buildChatId } from "@/lib/chat";

type Props = {
  requestId: string;
  ownerUid: string;
  passengerName: string;
  route: string;
};

export default function RequestContact({ requestId, ownerUid, passengerName, route }: Props) {
  const { user, authLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showChat, setShowChat] = useState(false);

  if (authLoading) return null;

  const isOwner = user?.uid === ownerUid;

  const chatId = user ? buildChatId("request", requestId, user.uid) : "";

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
        <p className="text-center text-gray-500 text-sm">This is your ride request.</p>
      ) : (
        <>
          <p className="text-center text-gray-500 text-sm mb-3">
            Message the passenger to offer a ride
          </p>
          <button
            onClick={handleChat}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            💬 Chat with Passenger
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Agree on price and pickup details in-app.
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
          ownerName={passengerName}
          route={route}
          listingType="request"
          listingId={requestId}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
