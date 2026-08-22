import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "La proposta a Carrara — Alessandro & Bridget",
  description:
    "Bozza illustrata della proposta sotto la Venere Apuana a Carrara.",
  robots: {
    index: false,
    follow: false
  }
};

export default function ProposalLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return children;
}
