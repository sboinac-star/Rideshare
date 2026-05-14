import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Journey — NWA Ride Share",
  description:
    "Post your ride as a driver in Northwest Arkansas. List your route, departure time, and available seats to connect with passengers across NWA.",
  openGraph: {
    title: "Post a Journey — NWA Ride Share",
    description:
      "Post your ride as a driver in Northwest Arkansas. List your route, departure time, and available seats.",
    url: "/driver/",
  },
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
