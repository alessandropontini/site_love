import Link from "next/link";

import styles from "./proposal.module.css";

export default function ProposalPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Un ricordo vero · Carrara</p>
        <h1>
          Sotto la <em>Venere Apuana</em>
        </h1>
        <p className={styles.intro}>
          Alessandro e Bridget diventano due burattini di carta. I fili si
          avvicinano, la città resta in silenzio e il bacio custodisce la
          proposta.
        </p>
      </header>

      <section className={styles.sceneCard} aria-labelledby="proposal-scene">
        <h2 className={styles.visuallyHidden} id="proposal-scene">
          La proposta di Alessandro e Bridget a Carrara
        </h2>

        <div className={styles.frame}>
          <svg
            className={styles.scene}
            viewBox="0 0 1200 800"
            role="img"
            aria-labelledby="proposal-svg-title proposal-svg-description"
            preserveAspectRatio="xMidYMid meet"
          >
            <title id="proposal-svg-title">
              Alessandro e Bridget si baciano sotto la Venere Apuana
            </title>
            <desc id="proposal-svg-description">
              Una scena originale da teatro di carta ambientata davanti
              all&apos;Accademia di Belle Arti di Carrara. Due burattini che
              rappresentano Alessandro e Bridget si baciano davanti a una
              Venere Apuana stilizzata, con le Alpi Apuane sullo sfondo.
            </desc>

            <defs>
              <linearGradient id="proposal-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c8d6d1" />
                <stop offset="0.68" stopColor="#e9d9c4" />
                <stop offset="1" stopColor="#d5aa8f" />
              </linearGradient>
              <linearGradient id="proposal-ground" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#bb927c" />
                <stop offset="0.5" stopColor="#d8b49a" />
                <stop offset="1" stopColor="#ac7c68" />
              </linearGradient>
              <linearGradient id="proposal-marble" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#aeb3b5" />
                <stop offset="0.48" stopColor="#7f8588" />
                <stop offset="1" stopColor="#c5c8c8" />
              </linearGradient>
              <filter id="proposal-shadow" x="-30%" y="-30%" width="160%" height="180%">
                <feDropShadow
                  dx="0"
                  dy="10"
                  floodColor="#2a1b20"
                  floodOpacity="0.24"
                  stdDeviation="8"
                />
              </filter>
              <clipPath id="proposal-stage-clip">
                <rect x="18" y="18" width="1164" height="764" rx="24" />
              </clipPath>
            </defs>

            <g clipPath="url(#proposal-stage-clip)">
              <rect width="1200" height="800" fill="url(#proposal-sky)" />

              <path
                d="M0 243 92 171l77 42 94-104 74 85 78-63 84 92 86-135 102 108 72-74 81 77 89-65 91 91 90-36v207H0Z"
                fill="#7d897b"
              />
              <path
                d="M0 276 101 211l78 45 89-72 88 83 99-67 90 60 109-88 76 77 102-56 79 67 95-45 94 54v149H0Z"
                fill="#a3a88f"
                opacity="0.74"
              />
              <path
                d="m77 193 15-22 10 27m147-65 14-24 14 29m295-22 14-28 16 33m326 84 15-21 13 24"
                fill="none"
                stroke="#f5eee5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="7"
                opacity="0.82"
              />

              <g className={styles.academy} aria-hidden="true">
                <path
                  d="M75 300h1050v304H75Z"
                  fill="#c9876e"
                  stroke="#6e4942"
                  strokeWidth="6"
                />
                <path d="M75 300h1050v35H75Z" fill="#edc6a6" />
                <path d="M480 265h240v339H480Z" fill="#dca081" />
                <path
                  d="M498 265 600 214l102 51Z"
                  fill="#ecd2b9"
                  stroke="#76504a"
                  strokeLinejoin="round"
                  strokeWidth="5"
                />
                <circle cx="600" cy="276" r="18" fill="#6f5b50" />
                <path d="M526 405h148v199H526Z" fill="#6b4944" />
                <path d="M550 428h100v176H550Z" fill="#31564c" />
                {[170, 310, 820, 960].map((x) => (
                  <g key={x}>
                    <rect
                      x={x - 43}
                      y="375"
                      width="86"
                      height="128"
                      rx="3"
                      fill="#f1d7bb"
                      stroke="#704b44"
                      strokeWidth="5"
                    />
                    <rect
                      x={x - 31}
                      y="390"
                      width="62"
                      height="95"
                      fill="#54746c"
                    />
                    <path
                      d={`M${x} 390v95M${x - 31} 438h62`}
                      stroke="#d8be9f"
                      strokeWidth="5"
                    />
                  </g>
                ))}
                <path
                  d="M75 548h1050v56H75"
                  fill="#b16f5e"
                  stroke="#754b43"
                  strokeWidth="5"
                />
              </g>

              <rect y="594" width="1200" height="206" fill="url(#proposal-ground)" />
              <path
                d="M0 650c183-30 333-15 497 12 168 28 366 17 703-26v164H0Z"
                fill="#cfaa90"
                opacity="0.74"
              />
              <path
                d="M45 706c246-36 434-32 625 1 168 29 313 27 485-3"
                fill="none"
                stroke="#9b705f"
                strokeDasharray="18 20"
                strokeLinecap="round"
                strokeWidth="5"
                opacity="0.45"
              />

              <g
                className={styles.venus}
                filter="url(#proposal-shadow)"
                aria-hidden="true"
              >
                <path
                  d="M503 529h194l34 65H469Z"
                  fill="#f0ebe3"
                  stroke="#7b7771"
                  strokeWidth="5"
                />
                <rect
                  x="486"
                  y="579"
                  width="228"
                  height="35"
                  rx="5"
                  fill="#faf7f1"
                  stroke="#7b7771"
                  strokeWidth="5"
                />
                <path
                  d="M600 300c-60 0-100 52-106 121-4 44 17 90 48 116h116c31-26 52-72 48-116-6-69-46-121-106-121Z"
                  fill="url(#proposal-marble)"
                  stroke="#50585b"
                  strokeLinejoin="round"
                  strokeWidth="7"
                />
                <ellipse
                  cx="600"
                  cy="274"
                  rx="37"
                  ry="44"
                  fill="#a7abad"
                  stroke="#50585b"
                  strokeWidth="7"
                />
                <path
                  d="M569 252c17-25 47-27 65-3-4-27-19-43-35-43-17 0-30 18-30 46Z"
                  fill="#707679"
                />
                <path
                  d="M539 350c-52 15-76 57-81 111 35 0 62-15 84-45m119-66c52 15 76 57 81 111-35 0-62-15-84-45"
                  fill="none"
                  stroke="#50585b"
                  strokeLinecap="round"
                  strokeWidth="29"
                />
                <path
                  d="M553 414c-20 56-38 94-67 122h91l23-71 23 71h91c-29-28-47-66-67-122"
                  fill="#92989a"
                  stroke="#50585b"
                  strokeLinejoin="round"
                  strokeWidth="7"
                />
                <path
                  d="M563 366c24 16 50 17 74 0M600 322v124"
                  fill="none"
                  stroke="#d4d6d5"
                  strokeLinecap="round"
                  strokeWidth="5"
                  opacity="0.62"
                />
              </g>

              <g className={styles.puppetRig} aria-hidden="true">
                <path d="M365 52h218M617 52h218" />
                <path d="m394 37 159 30m94 0 159-30" />
              </g>
              <g className={styles.strings} aria-hidden="true">
                <path d="M420 55 492 468M550 60 540 444M780 55 708 468M650 60 660 444" />
                <path d="M368 52 452 588M832 52 748 588" />
              </g>

              <g
                className={styles.alessandro}
                filter="url(#proposal-shadow)"
                aria-hidden="true"
              >
                <path
                  d="M469 528c-27 37-35 102-31 175h143c4-73-6-140-39-178Z"
                  fill="#e7d7bf"
                  stroke="#412f2d"
                  strokeLinejoin="round"
                  strokeWidth="7"
                />
                <path
                  d="M449 595c-35 21-48 62-54 101m164-103c29 8 48 29 66 52"
                  fill="none"
                  stroke="#412f2d"
                  strokeLinecap="round"
                  strokeWidth="28"
                />
                <path
                  d="M449 595c-35 21-48 62-54 101m164-103c29 8 48 29 66 52"
                  fill="none"
                  stroke="#d9c4a8"
                  strokeLinecap="round"
                  strokeWidth="17"
                />
                <ellipse
                  cx="536"
                  cy="486"
                  rx="48"
                  ry="53"
                  fill="#dba185"
                  stroke="#412f2d"
                  strokeWidth="7"
                />
                <path
                  d="M490 482c-2-44 25-70 55-67 24 3 43 21 43 48-18-14-48-23-83-11Z"
                  fill="#352827"
                />
                <g className={styles.glasses}>
                  <rect x="495" y="468" width="35" height="26" rx="8" />
                  <rect x="539" y="468" width="35" height="26" rx="8" />
                  <path d="M530 479h9" />
                </g>
                <path
                  d="M558 507c-8 9-20 11-31 4m5 7c8 8 17 8 25 0"
                  fill="none"
                  stroke="#4a2928"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                <path
                  d="M488 702h38l-7 78h-47Zm48 0h38l12 78h-47Z"
                  fill="#39483a"
                  stroke="#2e302b"
                  strokeLinejoin="round"
                  strokeWidth="7"
                />
                <circle cx="395" cy="696" r="13" fill="#dba185" stroke="#412f2d" strokeWidth="6" />
                <circle cx="625" cy="645" r="13" fill="#dba185" stroke="#412f2d" strokeWidth="6" />
              </g>

              <g
                className={styles.bridget}
                filter="url(#proposal-shadow)"
                aria-hidden="true"
              >
                <path
                  d="M617 455c-4-42 21-71 54-70 38 1 60 35 49 81l-8 67h-94Z"
                  fill="#3b282b"
                  stroke="#3b282b"
                  strokeLinejoin="round"
                  strokeWidth="10"
                />
                <path
                  d="M641 527c-36 38-49 104-47 176h156c1-70-15-137-55-178Z"
                  fill="#8b3347"
                  stroke="#42272d"
                  strokeLinejoin="round"
                  strokeWidth="7"
                />
                <path
                  d="M613 590c-31 18-48 52-61 90m160-91c29 17 42 53 48 91"
                  fill="none"
                  stroke="#42272d"
                  strokeLinecap="round"
                  strokeWidth="28"
                />
                <path
                  d="M613 590c-31 18-48 52-61 90m160-91c29 17 42 53 48 91"
                  fill="none"
                  stroke="#bd6c7a"
                  strokeLinecap="round"
                  strokeWidth="17"
                />
                <ellipse
                  cx="663"
                  cy="485"
                  rx="48"
                  ry="53"
                  fill="#dca084"
                  stroke="#42272d"
                  strokeWidth="7"
                />
                <path
                  d="M617 478c-5-37 13-67 43-72 32-5 58 21 58 59-19-17-49-27-83-15Z"
                  fill="#3b282b"
                />
                <path
                  d="M638 510c10 7 21 6 30-2"
                  fill="none"
                  stroke="#7f3241"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                <path
                  d="M604 702h42l-5 78h-43Zm54 0h43l6 78h-43Z"
                  fill="#6e2638"
                  stroke="#42272d"
                  strokeLinejoin="round"
                  strokeWidth="7"
                />
                <circle cx="552" cy="680" r="13" fill="#dca084" stroke="#42272d" strokeWidth="6" />
                <circle cx="760" cy="680" r="13" fill="#dca084" stroke="#42272d" strokeWidth="6" />
              </g>

              <g className={styles.kiss} aria-hidden="true">
                <path
                  d="M600 469c13-18 38-3 26 15-8 12-26 22-26 22s-18-10-26-22c-12-18 13-33 26-15Z"
                  fill="#a83b52"
                  stroke="#5b2731"
                  strokeWidth="4"
                />
                <path
                  d="M581 515c13 8 25 8 38 0"
                  fill="none"
                  stroke="#f3d7c0"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </g>

              <g className={styles.paperLabel} aria-hidden="true">
                <path d="M860 676h266v73H846Z" fill="#f1e5d5" stroke="#573a37" strokeWidth="5" />
                <text x="982" y="707" textAnchor="middle">
                  CARRARA
                </text>
                <text x="982" y="732" textAnchor="middle">
                  VENERE APUANA
                </text>
              </g>
            </g>

            <rect
              x="18"
              y="18"
              width="1164"
              height="764"
              rx="24"
              fill="none"
              stroke="#e8cfb5"
              strokeWidth="9"
            />
            <rect
              x="34"
              y="34"
              width="1132"
              height="732"
              rx="17"
              fill="none"
              stroke="#472b31"
              strokeWidth="3"
            />
          </svg>
        </div>

        <footer className={styles.caption}>
          <div>
            <span>La proposta</span>
            <strong>Alessandro & Bridget · Carrara</strong>
          </div>
          <p>
            Bozza vettoriale originale. La scena è disponibile soltanto in
            sviluppo finché non viene approvata.
          </p>
        </footer>
      </section>

      <Link className={styles.back} href="/">
        ← Torna al sito
      </Link>
    </main>
  );
}
