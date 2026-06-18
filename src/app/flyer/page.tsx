import type { Metadata } from "next";
import FlyerClient from "./FlyerClient";

export const metadata: Metadata = {
  title: "Printable Flyer — NWA Ride Share",
  description: "Print a flyer to share NWA Ride Share with your community.",
};

export default function FlyerPage() {
  return <FlyerClient />;
}
