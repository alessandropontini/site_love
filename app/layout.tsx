import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const uiFont = Instrument_Sans({
  subsets: ["latin"],
  weight: "variable",
  style: "normal",
  display: "swap",
  variable: "--font-ui"
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Alessandro & Bridget — La nostra avventura",
  description:
    "Un teatro di cartone da attraversare insieme: quattro atti, piccoli giochi e un finale da sbloccare."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${uiFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
