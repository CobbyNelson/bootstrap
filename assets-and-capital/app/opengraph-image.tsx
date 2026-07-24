import { ImageResponse } from "next/og";

export const alt = "Assets & Capital — Where quality assets meet ready capital.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          padding: "72px",
          background: "linear-gradient(135deg, #0b1c33 0%, #132f52 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", position: "relative", width: "56px", height: "56px" }}>
            <svg width="56" height="56" viewBox="0 0 44 44">
              <polygon points="1,41 12,41 25,17 14,17" fill="#8b95a4" />
              <polygon points="9,41 20,41 35,5 24,5" fill="#e5322b" />
              <polygon points="24,5 33,5 43,41 34,41" fill="#ffffff" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ color: "#ffffff", fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              ASSETS <span style={{ color: "#e5322b" }}>&</span> CAPITAL
            </span>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ display: "flex", flexWrap: "wrap", color: "#ffffff", fontSize: "76px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Where quality assets meet <span style={{ color: "#f16d61", marginLeft: "18px" }}>ready capital.</span>
          </span>
          <span style={{ color: "#b3c4dc", fontSize: "28px", marginTop: "28px", maxWidth: "820px" }}>
            The investment marketplace connecting vetted businesses with a global network of ready investors.
          </span>
        </div>

        {/* footer chips */}
        <div style={{ display: "flex", gap: "14px" }}>
          {["Screened & verified", "Mandate-matched", "Global coverage"].map((t) => (
            <span
              key={t}
              style={{
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
