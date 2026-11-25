import { ImageResponse } from "next/og";

export const alt = "ATLAS. — World Vintage & Archive Map";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Root share card: monochrome globe reticle with the live-market emerald accent. */
export default function OpengraphImage() {
  const globe = `<svg width="420" height="420" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" fill="none">
    <circle cx="210" cy="210" r="168" fill="#ECEBE6"/>
    <circle cx="210" cy="210" r="168" stroke="#111111" stroke-width="3"/>
    <ellipse cx="210" cy="210" rx="84" ry="168" stroke="#111111" stroke-opacity="0.35" stroke-width="2"/>
    <ellipse cx="210" cy="210" rx="168" ry="58" stroke="#111111" stroke-opacity="0.35" stroke-width="2"/>
    <line x1="42" y1="210" x2="378" y2="210" stroke="#111111" stroke-opacity="0.35" stroke-width="2"/>
    <line x1="210" y1="20" x2="210" y2="70" stroke="#ECEBE6" stroke-width="3"/>
    <line x1="210" y1="350" x2="210" y2="400" stroke="#ECEBE6" stroke-width="3"/>
    <line x1="20" y1="210" x2="70" y2="210" stroke="#ECEBE6" stroke-width="3"/>
    <line x1="350" y1="210" x2="400" y2="210" stroke="#ECEBE6" stroke-width="3"/>
    <circle cx="262" cy="172" r="12" fill="#10B981"/>
    <circle cx="262" cy="172" r="26" stroke="#10B981" stroke-opacity="0.45" stroke-width="3"/>
  </svg>`;
  const src = `data:image/svg+xml;base64,${Buffer.from(globe).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#111111", padding: "0 80px", gap: 64 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={420} height={420} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 800, color: "#FFFFFF", letterSpacing: -2 }}>ATLAS.</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#ECEBE6", letterSpacing: 2 }}>WORLD VINTAGE &amp; ARCHIVE MAP</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#A1A1AA" }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#10B981" }} />
            137 COUNTRIES · 13,054 ARCHIVE SPOTS
          </div>
        </div>
      </div>
    ),
    size,
  );
}
