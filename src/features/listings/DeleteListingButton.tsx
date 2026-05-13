"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/AuthProvider";

type Props = {
  collection: "journeys" | "requests";
  docId: string;
  ownerUid: string;
};

export default function DeleteListingButton({ collection, docId, ownerUid }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.uid !== ownerUid) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteDoc(doc(db, collection, docId));
      router.push("/");
    } catch {
      setError("Failed to delete. Please try again.");
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => setConfirming(true)}
          className="w-full text-sm text-red-500 hover:text-red-700 py-1 transition"
        >
          Delete this listing
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
      <p className="text-sm text-gray-700 font-medium text-center mb-3">
        This will permanently delete the listing.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 py-2 text-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg font-medium transition"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
      </div>
    </div>
  );
}
