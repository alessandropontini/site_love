'use client';

import { useEffect, useState, type MouseEvent } from "react";

import { EditorialLanguageSelector } from "@/components/editorial/EditorialLocaleProvider";
import { scrollToEditorialSection } from "@/components/editorial/editorialScroll";
import type {
  EditorialContent,
  EditorialSectionId
} from "@/lib/editorialConfig";
import { editorialSectionIds } from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";

export function EditorialNavigation({
  content
}: {
  content: EditorialContent;
}) {
  const [activeSection, setActiveSection] = useState<EditorialSectionId>(
    editorialSectionIds.story
  );

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-nav-section]")
    );
    if (!sections.length) return;

    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      const activationLine = window.innerHeight * 0.38;
      const current = sections.reduce<HTMLElement>((candidate, section) => {
        const sectionTop = section.getBoundingClientRect().top;
        return sectionTop <= activationLine ? section : candidate;
      }, sections[0]);
      const section = current.getAttribute(
        "data-nav-section"
      ) as EditorialSectionId | null;
      if (section) setActiveSection(section);
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };
    const observer = new IntersectionObserver(scheduleUpdate, {
      rootMargin: "-38% 0px -61% 0px",
      threshold: 0
    });

    sections.forEach((section) => observer.observe(section));
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const navigateToSection = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: EditorialSectionId
  ) => {
    if (scrollToEditorialSection(event, sectionId)) {
      setActiveSection(sectionId);
    }
  };

  const renderSectionLinks = (mobile = false) =>
    content.navigation.items.map((item) => (
      <a
        key={item.id}
        href={`#${item.id}`}
        onClick={(event) => navigateToSection(event, item.id)}
        aria-current={activeSection === item.id ? "location" : undefined}
        data-active={activeSection === item.id}
      >
        {mobile ? item.shortLabel : item.label}
      </a>
    ));

  return (
    <>
      <header className={styles.navigationShell}>
        <nav
          className={styles.navigation}
          aria-label={content.accessibility.navigation}
        >
          <a
            className={styles.brand}
            href={`#${editorialSectionIds.story}`}
            onClick={(event) =>
              navigateToSection(event, editorialSectionIds.story)
            }
          >
            <span aria-hidden="true">A</span>
            <span className={styles.brandAmpersand} aria-hidden="true">
              &amp;
            </span>
            <span aria-hidden="true">B</span>
            <span className={styles.srOnly}>{content.navigation.brand}</span>
          </a>
          <div className={styles.navigationLinks}>
            {renderSectionLinks()}
          </div>
          <div className={styles.navigationActions}>
            <EditorialLanguageSelector
              className={styles.languageSelector}
              labels={content.language}
            />
            <a
              className={styles.rsvpPill}
              href={`#${editorialSectionIds.rsvp}`}
              onClick={(event) =>
                navigateToSection(event, editorialSectionIds.rsvp)
              }
            >
              {content.navigation.rsvp}
            </a>
          </div>
        </nav>
      </header>
      <nav
        className={styles.mobileNavigation}
        aria-label={content.accessibility.mobileNavigation}
      >
        {renderSectionLinks(true)}
      </nav>
    </>
  );
}
