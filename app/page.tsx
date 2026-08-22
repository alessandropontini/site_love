import type { Metadata } from "next";
import { headers } from "next/headers";

import { EditorialHome } from "@/components/editorial/EditorialHome";
import { getEditorialContent } from "@/lib/editorialConfig";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : undefined;
  const content = getEditorialContent("it");
  const socialImagePath = "/og-turtle-v1.jpg";
  const imageUrl = origin ? `${origin}${socialImagePath}` : socialImagePath;

  return {
    title: content.metadata.title,
    description: content.metadata.description,
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: content.navigation.brand,
      title: content.metadata.title,
      description: content.metadata.description,
      url: origin,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: content.metadata.ogAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: content.metadata.title,
      description: content.metadata.description,
      images: [
        {
          url: imageUrl,
          alt: content.metadata.ogAlt
        }
      ]
    }
  };
}

export default function Home() {
  return <EditorialHome />;
}
