"use client";

import Link from "next/link";
import { featuredEvent } from "@/lib/constants";

export default function EventSpotlightModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-[slideUp_0.25s_ease-out]">
        {/* Festive header */}
        <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-6 pt-7 pb-8 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg leading-none transition"
            aria-label="Close"
          >
            ×
          </button>
          <div className="text-5xl mb-2">{featuredEvent.emoji}</div>
          <h2 className="text-xl font-extrabold leading-tight">{featuredEvent.name}</h2>
          <p className="text-orange-50 text-sm mt-1 font-medium">{featuredEvent.dateLabel}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <a
            href={featuredEvent.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 text-sm text-gray-600 mb-5 hover:text-orange-600 transition"
          >
            <span className="text-base shrink-0">📍</span>
            <span>
              <span className="font-semibold text-gray-800 block">{featuredEvent.venue}</span>
              {featuredEvent.address}
              <span className="text-orange-600 font-semibold block text-xs mt-0.5">Get directions →</span>
            </span>
          </a>

          <p className="text-center text-gray-700 font-semibold text-sm mb-4">
            Carpool with neighbors — save gas, ride together 🚗
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/driver?event=1"
              onClick={onClose}
              className="flex flex-col items-center gap-1 bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition"
            >
              <span className="text-2xl">🚗</span>
              <span className="text-sm">Offer a ride</span>
            </Link>
            <Link
              href="/passenger?event=1"
              onClick={onClose}
              className="flex flex-col items-center gap-1 bg-gradient-to-br from-purple-500 to-violet-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-200 active:scale-95 transition"
            >
              <span className="text-2xl">🙋</span>
              <span className="text-sm">Need a ride</span>
            </Link>
          </div>

          <button
            onClick={onClose}
            className="w-full text-center text-gray-400 text-sm font-medium mt-4 py-2 hover:text-gray-600 transition"
          >
            Maybe later
          </button>
        </div>
      </div>

      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
