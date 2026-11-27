import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title =
    searchParams.get("title")?.slice(0, 90) || "Bylaw One — Building rules. One code.";
  const subtitle =
    searchParams.get("subtitle")?.slice(0, 160) ||
    "Every rule traced to its official page. Open code (Apache-2.0) and open data (CC BY 4.0).";
  const kicker = searchParams.get("kicker")?.slice(0, 60) || "Bylaw One";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f5f3ed",
          color: "#080909",
          padding: "64px",
          border: "12px solid #080909",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "22px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#5b5e56",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "32px",
              backgroundColor: "#ff6b52",
            }}
          />
          <span>{kicker}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "60px",
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#080909",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "28px",
              lineHeight: 1.38,
              color: "#171917",
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #c8ccc0",
            paddingTop: "24px",
            fontSize: "20px",
            color: "#5b5e56",
          }}
        >
          <span>bylaws-india.vercel.app</span>
          <span>Apache-2.0 · CC BY 4.0</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
