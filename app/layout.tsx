import type { Metadata } from "next";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Structured Building Bylaws",
  description:
    "Curated, versioned, machine-readable public dataset and regulatory viewer for municipal building bylaws and master plan zoning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
