import { ImageResponse } from "next/og";
import { fetchManifest, getVisibleJurisdictions } from "@/lib/data";

export const alt = "Bylaw One — Building rules. One code.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const manifest = await fetchManifest().catch(() => null);
  const visible = manifest ? getVisibleJurisdictions(manifest) : [];
  const rootJur =
    visible.find((j) => visible.some((child) => child.parent === j.id)) ??
    visible[0];
  const cityLabel = rootJur?.aliases?.[0] ?? rootJur?.name ?? "City";
  const regionLabel = rootJur?.aliases?.[2] ?? rootJur?.name ?? cityLabel;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
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
            fontSize: "24px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#5b5e56",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "36px",
              backgroundColor: "#ff6b52",
            }}
          />
            <span>{`Bylaw One · ${regionLabel}`}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                fontSize: "68px",
                fontWeight: 700,
                lineHeight: 1.08,
                color: "#080909",
              }}
            >
              {`${cityLabel}'s building rules. One code.`}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "30px",
                lineHeight: 1.35,
                color: "#171917",
              }}
            >
              Official acts, municipal bye-laws, master plan zoning regulations,
              and maps joined into one readable code. Every rule traced to its
              page.
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
          <span>Open Code (Apache-2.0) · Open Data (CC BY 4.0)</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
