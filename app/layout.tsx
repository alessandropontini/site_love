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
  title: "Alessandro & Bridget — 13 maggio 2028",
  description:
    "La nostra storia e le informazioni per il matrimonio a Casa Nuova, Niviano di Rivergaro.",
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Alessandro & Bridget",
    title: "Alessandro & Bridget — 13 maggio 2028",
    description:
      "La nostra storia e le informazioni per il matrimonio a Casa Nuova, Niviano di Rivergaro."
  },
  twitter: {
    card: "summary_large_image",
    title: "Alessandro & Bridget — 13 maggio 2028",
    description:
      "La nostra storia e le informazioni per il matrimonio a Casa Nuova, Niviano di Rivergaro."
  }
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
