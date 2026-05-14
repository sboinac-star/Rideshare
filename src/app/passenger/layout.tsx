import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Ride — NWA Ride Share",
  description:
    "Need a ride in Northwest Arkansas? Post your travel request and connect with drivers going your way across NWA.",
  openGraph: {
    title: "Request a Ride — NWA Ride Share",
    description:
      "Need a ride in Northwest Arkansas? Post your travel request and connect with drivers going your way.",
    url: "/passenger/",
  },
};

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
