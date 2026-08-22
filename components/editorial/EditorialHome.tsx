'use client';

import { EditorialNavigation } from "@/components/editorial/EditorialNavigation";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { FinalLetter } from "@/components/editorial/FinalLetter";
import { HeroInvitation } from "@/components/editorial/HeroInvitation";
import {
  EditorialLocaleProvider,
  useEditorialLocale
} from "@/components/editorial/EditorialLocaleProvider";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { RelationshipTimeline } from "@/components/editorial/RelationshipTimeline";
import { RsvpSection } from "@/components/editorial/RsvpSection";
import { WeddingVenue } from "@/components/editorial/WeddingVenue";
import { getEditorialContent } from "@/lib/editorialConfig";
import { useEffect, useMemo } from "react";

import styles from "./EditorialHome.module.css";

export function EditorialHome() {
  return (
    <EditorialLocaleProvider>
      <EditorialHomeContent />
    </EditorialLocaleProvider>
  );
}

function EditorialHomeContent() {
  const { locale } = useEditorialLocale();
  const content = useMemo(() => getEditorialContent(locale), [locale]);

  useEffect(() => {
    const updateMeta = (selector: string, value: string) => {
      document
        .querySelector<HTMLMetaElement>(selector)
        ?.setAttribute("content", value);
    };
    const frame = window.requestAnimationFrame(() => {
      document.title = content.metadata.title;
      updateMeta('meta[name="description"]', content.metadata.description);
      updateMeta('meta[property="og:title"]', content.metadata.title);
      updateMeta('meta[property="og:description"]', content.metadata.description);
      updateMeta('meta[property="og:image:alt"]', content.metadata.ogAlt);
      updateMeta('meta[name="twitter:title"]', content.metadata.title);
      updateMeta('meta[name="twitter:description"]', content.metadata.description);
      updateMeta('meta[name="twitter:image:alt"]', content.metadata.ogAlt);
      updateMeta(
        'meta[property="og:locale"]',
        locale === "it" ? "it_IT" : "en_US"
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [content, locale]);

  return (
    <div className={styles.editorial} data-locale={locale}>
      <a className={styles.skipLink} href="#editorial-main">
        {content.accessibility.skip}
      </a>
      <EditorialNavigation content={content} />
      <main id="editorial-main" tabIndex={-1}>
        <HeroInvitation content={content} />
        <RelationshipTimeline content={content} />
        <PhotoGallery content={content} />
        <WeddingVenue content={content} />
        <RsvpSection content={content} />
        <FinalLetter content={content} />
      </main>
      <EditorialFooter content={content} />
    </div>
  );
}
