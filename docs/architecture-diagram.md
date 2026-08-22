# Disegno architetturale operativo

Questo disegno descrive l'architettura prevista per la pubblicazione di SITE LOVE.
Rappresenta i confini di sicurezza, i flussi degli invitati e degli sposi, il
rilascio da GitHub e il percorso separato dei backup. Non contiene credenziali,
dati reali degli invitati o nomi di risorse ancora da creare.

```mermaid
flowchart LR
  classDef actor fill:#ffffff,stroke:#5a6b7b,color:#17212b,stroke-width:1.5px;
  classDef edge fill:#eaf6ff,stroke:#2388d9,color:#102a43,stroke-width:1.5px;
  classDef app fill:#edf9f2,stroke:#21885a,color:#133f2b,stroke-width:1.5px;
  classDef security fill:#fff7df,stroke:#d89a1d,color:#5a3b00,stroke-width:1.5px;
  classDef data fill:#f3edff,stroke:#7551c2,color:#2f1d59,stroke-width:1.5px;
  classDef private fill:#fff0f0,stroke:#c84b4b,color:#5b1d1d,stroke-width:1.5px;

  subgraph people["Persone e sorgente"]
    guest["Invitato<br/>browser + QR"]:::actor
    couple["Sposi<br/>browser"]:::actor
    operator["Alessandro<br/>Mac locale"]:::actor
    github["GitHub privato<br/>codice sorgente"]:::edge
  end

  subgraph publicBoundary["Confine pubblico"]
    dns["Dominio .it + DNS<br/>rinnovo e record"]:::edge

    subgraph vercel["Vercel"]
      preview["Preview<br/>verifica prima del rilascio"]:::edge
      production["Production<br/>versione corrente"]:::edge
      lastGood["Ultima versione valida<br/>rollback"]:::edge
      cdn["HTTPS + CDN<br/>home statica e privacy"]:::app
      next["Next.js server<br/>RSVP + area sposi + export"]:::app
    end
  end

  subgraph protectedServices["Servizi protetti"]
    turnstile["Cloudflare Turnstile<br/>anti-bot sul form RSVP"]:::security
    clerk["Clerk Production<br/>login, MFA e sessioni sposi"]:::security
    neon["Neon Postgres EU<br/>schema RSVP + ruolo minimo"]:::data
    encrypted["Spazio privato cifrato<br/>backup, manifest e QR"]:::private
  end

  guest -->|"visita pubblica"| dns
  dns --> production
  production --> cdn
  production --> next
  guest -->|"link personale opaco"| next
  next -->|"verifica server"| turnstile
  next -->|"token hash + risposte minime"| neon

  couple -.->|"autenticazione"| clerk
  clerk -.->|"sessione verificata"| next
  next -->|"dashboard / CSV privato"| couple

  operator -->|"modifiche controllate"| github
  github -.->|"build automatico"| preview
  preview -.->|"approvazione umana"| production
  lastGood -.->|"rollback d'emergenza"| production

  operator -.->|"migrazioni con ruolo proprietario"| neon
  neon -.->|"pg_dump senza token in chiaro"| encrypted
  operator -.->|"generazione privata dopo il dominio"| encrypted
```

## Come leggere le frecce

- Le frecce continue sono traffico del sito o dati dell'applicazione.
- Le frecce tratteggiate sono autenticazione, pubblicazione o operazioni manuali.
- La home pubblica non interroga il database: Neon viene usato soltanto dalle
  route RSVP e amministrative.
- Clerk non protegge gli invitati: protegge esclusivamente l'area degli sposi.
- Il link personale passa al server, ma nel database viene conservato soltanto
  il suo hash SHA-256.
- Backup, manifest e QR restano fuori da GitHub, Vercel e dalla cartella
  pubblica del sito.

## Ambienti e ritorno alla versione valida

Il flusso normale è `GitHub → Preview → Production`. Prima di promuovere una
modifica si controllano build, form e area sposi nella Preview. Se il sito si
rompe dopo un rilascio, Vercel Hobby permette di tornare alla precedente
versione di produzione; il database non viene automaticamente riportato
indietro insieme al codice e va gestito separatamente.

La procedura completa è in `docs/operations-guide.md`.
