"use client";

import { useState } from "react";
import RatingModal from "@/app/RatingModal";
import { useAuth } from "@/app/AuthProvider";

type Props = {
  ratedUid: string | undefined;
  ratedName: string;
  journeyId: string;
};

export default function RateButton({ ratedUid, ratedName, journeyId }: Props) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!user || !ratedUid || user.uid === ratedUid) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="mt-3 w-full py-2 border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-medium rounded-lg transition text-sm"
      >
        ⭐ Rate this driver
      </button>
      {showModal && (
        <RatingModal
          ratedUid={ratedUid}
          ratedName={ratedName}
          journeyId={journeyId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
