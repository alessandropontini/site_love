import type { Metadata } from "next";
import { Manrope, Silkscreen } from "next/font/google";
import "./globals.css";

const uiFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui"
});

const titleFont = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-title"
});

export const metadata: Metadata = {
  title: "Pixel Quest: Alessandro & Bridget",
  description:
    "Play through four retro mini-games and relive the love story of Alessandro and Bridget."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${uiFont.variable} ${titleFont.variable}`}>{children}</body>
    </html>
  );
}
