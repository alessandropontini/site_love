import Link from "next/link";

import { getRsvpInvitation } from "@/lib/rsvp/db";
import type { RsvpLocale } from "@/lib/rsvp/types";
import {
  getTurnstileSiteKey,
  isRsvpProtectionReady
} from "@/lib/rsvp/turnstile";

import { RsvpForm } from "./RsvpForm";
import styles from "../rsvp.module.css";

export const dynamic = "force-dynamic";

const pageCopy = {
  it: {
    kicker: "Alessandro & Bridget",
    title: "Conferma la tua presenza",
    intro:
      "Rispondi per ogni persona inclusa nel tuo invito. Potrai tornare su questo link per modificare la risposta fino alla scadenza.",
    deadline: "Risposte entro",
    invalidTitle: "Invito non disponibile",
    invalidBody:
      "Il link non è valido, è scaduto oppure è stato sostituito. Contattaci per ricevere assistenza.",
    unavailableTitle: "RSVP in preparazione",
    unavailableBody:
      "La conferma online non è ancora disponibile. Riprova più tardi.",
    home: "Torna al sito",
    italian: "Italiano",
    english: "English"
  },
  en: {
    kicker: "Alessandro & Bridget",
    title: "Confirm your attendance",
    intro:
      "Reply for every person included in your invitation. You can return to this link to update the response until the deadline.",
    deadline: "Please reply by",
    invalidTitle: "Invitation unavailable",
    invalidBody:
      "This link is invalid, expired, or has been replaced. Contact us for assistance.",
    unavailableTitle: "RSVP coming soon",
    unavailableBody:
      "Online confirmation is not available yet. Please try again later.",
    home: "Back to the website",
    italian: "Italiano",
    english: "English"
  }
} as const;

type RsvpPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
};

function requestedLocale(
  value: string | string[] | undefined,
  fallback: RsvpLocale
): RsvpLocale {
  return value === "en" || value === "it" ? value : fallback;
}

function formatDeadline(deadline: string, locale: RsvpLocale) {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(deadline));
}

export default async function PersonalRsvpPage({
  params,
  searchParams
}: RsvpPageProps) {
  const { token } = await params;
  const query = await searchParams;

  if (!isRsvpProtectionReady()) {
    const locale = requestedLocale(query.lang, "it");
    const copy = pageCopy[locale];

    return (
      <RsvpNotice
        body={copy.unavailableBody}
        locale={locale}
        title={copy.unavailableTitle}
      />
    );
  }

  const lookup = await getRsvpInvitation(token);
  const fallbackLocale =
    lookup.status === "ready" ? lookup.invitation.locale : "it";
  const locale = requestedLocale(query.lang, fallbackLocale);
  const copy = pageCopy[locale];

  if (lookup.status !== "ready") {
    return (
      <RsvpNotice
        body={
          lookup.status === "invalid"
            ? copy.invalidBody
            : copy.unavailableBody
        }
        locale={locale}
        title={
          lookup.status === "invalid"
            ? copy.invalidTitle
            : copy.unavailableTitle
        }
      />
    );
  }

  return (
    <main className={styles.page} lang={locale}>
      <section className={styles.formCard} aria-labelledby="rsvp-heading">
        <header className={styles.formHeader}>
          <div className={styles.headerTopline}>
            <p className={styles.kicker}>{copy.kicker}</p>
            <nav className={styles.localeNav} aria-label="Language">
              <Link
                aria-current={locale === "it" ? "page" : undefined}
                href={`/rsvp/${token}?lang=it`}
              >
                {copy.italian}
              </Link>
              <Link
                aria-current={locale === "en" ? "page" : undefined}
                href={`/rsvp/${token}?lang=en`}
              >
                {copy.english}
              </Link>
            </nav>
          </div>
          <h1 id="rsvp-heading">{copy.title}</h1>
          <p className={styles.householdName}>
            {lookup.invitation.householdName}
          </p>
          <p>{copy.intro}</p>
          {lookup.invitation.deadline ? (
            <p className={styles.deadline}>
              <span>{copy.deadline}</span>
              <strong>
                {formatDeadline(lookup.invitation.deadline, locale)}
              </strong>
            </p>
          ) : null}
        </header>

        <RsvpForm
          invitation={lookup.invitation}
          locale={locale}
          token={token}
          turnstileSiteKey={getTurnstileSiteKey()}
        />

        <Link className={styles.secondaryAction} href="/">
          {copy.home}
        </Link>
      </section>
    </main>
  );
}

function RsvpNotice({
  title,
  body,
  locale
}: {
  title: string;
  body: string;
  locale: RsvpLocale;
}) {
  const copy = pageCopy[locale];

  return (
    <main className={styles.page} lang={locale}>
      <section className={styles.noticeCard} aria-labelledby="rsvp-notice">
        <p className={styles.kicker}>{copy.kicker}</p>
        <h1 id="rsvp-notice">{title}</h1>
        <p>{body}</p>
        <Link className={styles.secondaryAction} href="/">
          {copy.home}
        </Link>
      </section>
    </main>
  );
}
