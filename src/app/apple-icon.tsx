import { ImageResponse } from "next/og";

import { BRAND_GOLD, BRAND_INK, MYTH_MARK_PATH } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_INK,
        }}
      >
        <svg width="148" height="148" viewBox="0 0 32 32">
          <path fill={BRAND_GOLD} fillRule="evenodd" d={MYTH_MARK_PATH} />
        </svg>
      </div>
    ),
    size,
  );
}
