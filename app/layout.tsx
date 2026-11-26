import type { Metadata } from "next";
import localFont from "next/font/local";
import { fetchManifest, getVisibleJurisdictions } from "@/lib/data";
import { Footer } from "@/components/Footer";
import "./globals.css";

const interTight = localFont({
  src: "./fonts/inter-tight-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

const sourceSerif = localFont({
  src: [
    {
      path: "./fonts/source-serif-4-latin-normal.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "./fonts/source-serif-4-latin-italic.woff2",
      weight: "400 600",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const manifest = await fetchManifest().catch(() => null);
  const visible = manifest ? getVisibleJurisdictions(manifest) : [];
  const rootJur =
    visible.find((j) => visible.some((child) => child.parent === j.id)) ??
    visible[0];
  const cityLabel = rootJur?.aliases?.[0] ?? rootJur?.name ?? "City";
  const desc = `${cityLabel}'s building rules. One code.`;

  return {
    title: "Bylaw One",
    description: desc,
    openGraph: {
      title: "Bylaw One",
      description: desc,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const manifest = await fetchManifest().catch(() => null);
  const visible = manifest ? getVisibleJurisdictions(manifest) : [];
  const rootJur =
    visible.find((j) => visible.some((child) => child.parent === j.id)) ??
    visible[0];

  return (
    <html
      lang="en"
      className={`${interTight.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body
        data-default-jurisdiction={rootJur?.id ?? ""}
        className="flex min-h-screen flex-col antialiased"
      >
        <div className="flex-1">{children}</div>
        <Footer jurisdictionId={rootJur?.id} />
      </body>
    </html>
  );
}
