import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#2563eb",
        borderRadius: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 110,
        color: "white",
        fontWeight: 700,
        fontFamily: "sans-serif",
      }}
    >
      R
    </div>
  );
}
