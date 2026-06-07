import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages — NWA Ride Share",
  description:
    "View your conversations with drivers and passengers on NWA Ride Share.",
  openGraph: {
    title: "Messages — NWA Ride Share",
    description: "View your conversations with drivers and passengers on NWA Ride Share.",
    url: "/messages/",
  },
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
