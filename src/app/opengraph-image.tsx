import { ImageResponse } from "next/og";

import { BRAND_CREAM, BRAND_GOLD, BRAND_INK, MYTH_MARK_PATH } from "@/lib/brand";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";

export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 50% 20%, #2a241c 0%, ${BRAND_INK} 58%)`,
        }}
      >
        <svg width="168" height="168" viewBox="0 0 32 32">
          <path fill={BRAND_GOLD} fillRule="evenodd" d={MYTH_MARK_PATH} />
        </svg>
        <div
          style={{
            marginTop: 28,
            color: BRAND_CREAM,
            fontSize: 84,
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          Myth
        </div>
        <div
          style={{
            marginTop: 14,
            color: BRAND_GOLD,
            fontSize: 36,
            lineHeight: 1,
          }}
        >
          or truth?
        </div>
        <div
          style={{
            marginTop: 28,
            maxWidth: 720,
            color: "#b7aa94",
            fontSize: 22,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size,
  );
}
