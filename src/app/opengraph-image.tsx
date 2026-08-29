import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Nepal Flood Watch — live flood monitoring for Nepal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social preview card. Generated rather than shipped as a static asset so it stays
 * in sync with the palette, and drawn with plain shapes only — no external fonts or
 * images, which keeps generation fast and cannot fail at request time.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c1014",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* The river, abstracted */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <path
            d="M 900 -40 C 860 120, 980 220, 900 330 C 830 430, 700 440, 640 540 C 600 610, 610 660, 600 700"
            fill="none"
            stroke="#c62828"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 900 -40 C 860 120, 980 220, 900 330 C 830 430, 700 440, 640 540 C 600 610, 610 660, 600 700"
            fill="none"
            stroke="#c62828"
            strokeWidth="34"
            strokeLinecap="round"
            opacity="0.14"
          />
        </svg>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#f76f6f",
              display: "flex",
            }}
          />
          <div
            style={{
              color: "#f76f6f",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
              display: "flex",
            }}
          >
            ACTIVE EMERGENCY · NEPAL
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              color: "#e8edf2",
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: -2.5,
              lineHeight: 1.05,
              display: "flex",
            }}
          >
            Nepal Flood Watch
          </div>
          <div
            style={{
              color: "#9aa7b4",
              fontSize: 31,
              lineHeight: 1.35,
              maxWidth: 760,
              display: "flex",
            }}
          >
            Live river levels, cross-checked news, verified helplines and a public help
            board for the Bhotekoshi–Trishuli flood.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {["English", "नेपाली", "हिन्दी", "Free · No login"].map((tag) => (
            <div
              key={tag}
              style={{
                border: "1px solid #33404c",
                borderRadius: 999,
                padding: "9px 20px",
                color: "#9aa7b4",
                fontSize: 21,
                display: "flex",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
