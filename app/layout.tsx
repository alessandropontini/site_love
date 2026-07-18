import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const uiFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui"
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
      <body className={uiFont.variable}>{children}</body>
    </html>
  );
}
