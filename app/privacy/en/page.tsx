import type { Metadata } from "next";

import styles from "@/app/privacy/privacy.module.css";
import { RSVP_PRIVACY_NOTICE_VERSION } from "@/lib/rsvp/privacy";

export const metadata: Metadata = {
  title: "RSVP data notice — Alessandro & Bridget",
  description:
    "Information about the processing of invitation and RSVP data."
};

const controllerNames =
  process.env.NEXT_PUBLIC_PRIVACY_CONTROLLER_NAMES?.trim() ||
  "Alessandro and Bridget";
const privacyContactEmail =
  process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim() || "";
const privacyConfigurationComplete = Boolean(
  process.env.NEXT_PUBLIC_PRIVACY_CONTROLLER_NAMES?.trim() &&
    privacyContactEmail
);
const isTrialMode = process.env.NEXT_PUBLIC_RSVP_TRIAL_MODE !== "0";

export default function EnglishPrivacyPage() {
  return (
    <main className={styles.page} lang="en">
      <article className={styles.card}>
        <p className={styles.kicker}>
          RSVP data notice · version {RSVP_PRIVACY_NOTICE_VERSION}
        </p>
        <h1>Information about the processing of personal data</h1>
        <p className={styles.lead}>
          This notice explains how the data required to manage invitations and
          replies for the wedding on 13 May 2028 is used. There is no
          advertising, commercial profiling, sale of data, or automated
          decision-making.
        </p>

        <section>
          <h2>1. Organisers and contact details</h2>
          <p>
            The processing is organised by <strong>{controllerNames}</strong>,
            as natural persons arranging their own wedding and, where data
            protection law applies to a specific operation, as data controllers.
          </p>
          <p>
            Questions, corrections, or data requests may be sent through the
            private channel used to deliver the invitation
            {privacyContactEmail ? (
              <>
                {" "}or by email to{" "}
                <a href={`mailto:${privacyContactEmail}`}>
                  {privacyContactEmail}
                </a>
              </>
            ) : null}
            . No data protection officer has been appointed because the
            conditions requiring one are not met by this personal activity.
          </p>
        </section>

        <section>
          <h2>2. Personal context and legal basis</h2>
          <p>
            This activity is carried out by natural persons for exclusively
            personal and family purposes, with no connection to a commercial or
            professional activity. It is designed to fall within the personal
            or household activity exclusion in Article 2(2)(c) and Recital 18
            of Regulation (EU) 2016/679.
          </p>
          <p>
            This notice is nevertheless provided voluntarily in line with the
            transparency standards of Articles 13 and 14. If the GDPR applied
            to a specific operation, the legal basis would be the organisers’
            legitimate interest in managing a private event to which the data
            subject is invited, under Article 6(1)(f). That interest is limited
            by data minimisation, restricted access, a fixed retention period,
            and the option to reply through the invitation’s private channel.
          </p>
          <p>
            The checkbox in the RSVP form records that this notice was read. It
            is not consent to marketing or any unrelated use.
          </p>
        </section>

        <section>
          <h2>3. Data, sources, and data subjects</h2>
          <p>
            The following data may be processed for each household: names
            already included in the invitation; the private invitation source;
            language; contact email; attendance; update date and version;
            permission for a +1; first and last name of a +1 only where the
            specific invitation allows one; and a yes/no indication about
            children. Non-health-related menu choices may be requested later.
          </p>
          <p>
            Invitee names come from the organisers’ personal knowledge or from
            family information used to prepare the list. Email and RSVP answers
            are supplied by the person completing the form. No children’s
            names, ages, or dates of birth are collected. The personal link
            token is stored in the database only as a non-reversible hash.
          </p>
        </section>

        <section>
          <h2>4. Purposes</h2>
          <p>The data is used only to:</p>
          <ul>
            <li>prepare and distribute personal invitations;</li>
            <li>record and allow changes to attendance;</li>
            <li>organise capacity, seating, and later menu choices;</li>
            <li>send strictly operational confirmations and reminders;</li>
            <li>protect the form against abuse and unauthorised access;</li>
            <li>produce a minimum list for the venue or caterer if necessary.</li>
          </ul>
        </section>

        <section>
          <h2>5. Optional provision and consequences</h2>
          <p>
            Replying online is optional. An email address and attendance answer
            are required only to record the reply through the website and send
            operational communications. Anyone who does not wish to use the
            form may contact the organisers through the private invitation
            channel. The only consequence is that the RSVP cannot be managed
            online.
          </p>
        </section>

        <section>
          <h2>6. +1s, couples, and children</h2>
          <p>
            When two people are already named in the invitation, both are
            already included and neither should be added as a +1. The +1 field
            appears only where that household is authorised to name one
            companion who is not already listed. The person entering a +1’s
            name must be authorised to share it and must make this notice
            available to that person.
          </p>
          <p>
            Only a yes/no indication of children’s attendance is stored. The
            form is not directed at children and does not ask them to provide
            data, create an account, or take any action.
          </p>
        </section>

        <section>
          <h2>7. Recipients and technical providers</h2>
          <p>
            RSVP data is accessible only to the organisers through an admin
            area protected by login and an access list. The minimum necessary
            data may be shared privately with the venue and caterer to organise
            attendance, seating, and meals. It is not published.
          </p>
          <p>
            Vercel hosts and runs the application; Neon stores the database in
            the configured EU region in Frankfurt; Cloudflare Turnstile
            prevents abuse; and Clerk authenticates administrators only.
            Turnstile processes technical device and request signals but not
            the RSVP fields entered in the form. Resend will be used for
            operational email only after activation and verification of the
            applicable agreements.
          </p>
        </section>

        <section>
          <h2>8. International transfers</h2>
          <p>
            Some providers or subprocessors may process technical or hosted
            data outside the European Economic Area. Where the GDPR applies,
            safeguards declared by providers may include, depending on the
            service and plan actually enabled, adequacy decisions such as the
            EU-US Data Privacy Framework and/or European Commission Standard
            Contractual Clauses. Before real guest data is used, the organisers
            will verify the plans, DPAs, subprocessors, and transfer mechanisms
            that actually apply to their accounts.
          </p>
        </section>

        <section>
          <h2>9. Retention</h2>
          <p>
            Personal RSVP data, email addresses, operational invitations,
            tokens, QR codes, exports, and backups will be deleted by 11 August
            2028, 90 days after the wedding. Technical logs or residual provider
            copies may follow the periods strictly required for security,
            recovery, and service obligations, after which they will be deleted
            or anonymised.
          </p>
        </section>

        <section>
          <h2>10. Security, cookies, and excluded data</h2>
          <p>
            The service uses HTTPS, random personal tokens, non-reversible
            hashes, server-side checks, anti-indexing protection, update limits,
            separate authentication, and restricted admin access. RSVP pages do
            not use advertising cookies, profiling, or analytics. Only
            technologies required for security and admin sessions may be used.
          </p>
          <p>
            Do not enter allergies, diagnoses, disabilities, or other health
            information. If such information becomes necessary, it will be
            handled separately with a dedicated channel and notice.
          </p>
        </section>

        <section>
          <h2>11. Rights and complaints</h2>
          <p>
            Where applicable, a data subject may request access, correction,
            deletion, restriction, or portability, or object to processing. The
            RSVP may also be corrected through the personal link before the
            deadline. Requests should be sent to the contact in section 1 and
            will be answered without undue delay.
          </p>
          <p>
            A complaint may be made to the{" "}
            <a
              href="https://www.garanteprivacy.it/"
              rel="noreferrer"
              target="_blank"
            >
              Italian Data Protection Authority
            </a>
            . There is no automated decision-making or profiling.
          </p>
        </section>

        <section>
          <h2>12. Updates</h2>
          <p>
            This notice may be updated if the form, providers, or organisational
            arrangements change. The version read when a response is submitted
            is recorded in the technical audit together with the date of the
            operation. This does not create consent for any additional purpose.
          </p>
        </section>

        <section lang="it">
          <h2>Versione italiana</h2>
          <p>
            L’informativa completa in italiano è disponibile nella{" "}
            <a href="/privacy">pagina privacy italiana</a>.
          </p>
        </section>

        {isTrialMode ? (
          <p className={styles.legalNote}>
            Trial version: the contact shown is temporary and the website must
            not yet be used for real guests. Before launch, the final identity
            and contact details, DPAs, subprocessors, and transfers for the
            plans actually used will be verified.
          </p>
        ) : !privacyConfigurationComplete ? (
          <p className={styles.legalNote}>
            Before collecting real guest data, the full names of the organisers
            and a direct privacy contact email must be configured in Vercel.
          </p>
        ) : null}
      </article>
    </main>
  );
}
