# Pubblicazione a costo minimo

## Architettura scelta

```text
dominio .it
  → Vercel Hobby (Next.js, HTTPS, CDN, funzioni server)
      → Neon Free (inviti e risposte RSVP)
      → Cloudflare Turnstile Free (anti-abuso del form)
      → Clerk Free (login esclusivo degli sposi)
```

La home resta statica e servita dalla CDN. Consumano funzioni server soltanto il
link RSVP personale, il login, la dashboard e l'export. L'indirizzo `Network`
mostrato da `npm run dev` è raggiungibile solo dalla rete locale: non è una
pubblicazione Internet.

Il disegno completo è in `docs/architecture-diagram.md`. Dopo l'attivazione dei
servizi, usare `docs/operations-guide.md` come guida per pannelli, comandi,
controlli ricorrenti, backup, restore e incidenti.

## Costo atteso

Stima verificata il 22 agosto 2026; ricontrollare sempre il checkout e i limiti
prima dell'acquisto.

| Voce | Piano iniziale | Costo previsto |
| --- | --- | ---: |
| Dominio `.it` | registrar a scelta | circa 3–5 € il primo anno, circa 11 € al rinnovo |
| [Vercel](https://vercel.com/pricing) | Hobby | 0 € entro i limiti |
| [Neon](https://neon.com/pricing) | Free | 0 € entro i limiti |
| [Clerk](https://clerk.com/pricing) | Free | 0 € entro i limiti |
| [Cloudflare Turnstile](https://www.cloudflare.com/application-services/products/turnstile/) | Free | 0 € |

Per un matrimonio il carico atteso è molto inferiore ai limiti gratuiti. Non
attivare upgrade automatici o componenti a consumo senza una nuova decisione.

## Ordine di attivazione

1. Acquistare il dominio definitivo, preferibilmente `.it`; non generare ancora
   QR.
2. Reclamare l'app Clerk di sviluppo con `npx -y clerk@latest auth login`, creare
   l'istanza di produzione e aggiungere dal pannello soltanto gli utenti degli
   sposi. La route pubblica di registrazione non esiste.
3. Creare un progetto Neon in regione AWS europea, applicare in ordine i file
   `db/migrations/*.sql` con l'utente proprietario e creare un ruolo runtime a
   privilegi minimi.
4. Creare un widget Turnstile associato al dominio di produzione.
5. Collegare il repository privato a Vercel, impostare le variabili Production e
   Preview, distribuire e collegare il dominio.
6. Verificare HTTPS, redirect del dominio canonico, header, login, form, export e
   backup.
7. Preparare la lista invitati in un JSON esterno al repository ed eseguire il
   generatore QR solo sul dominio definitivo.
8. Scansionare ogni QR stampato e confrontarlo con il nucleo nel manifest
   privato prima della consegna.

## Variabili di produzione

| Variabile | Visibilità | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | pubblica | origine HTTPS canonica, senza slash finale |
| `DATABASE_URL` | segreta | ruolo Neon runtime, non proprietario |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | pubblica | widget anti-abuso |
| `TURNSTILE_SECRET_KEY` | segreta | verifica server Turnstile |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | pubblica | client login sposi |
| `CLERK_SECRET_KEY` | segreta | verifica server Clerk |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | pubblica | deve valere `/sign-in` |
| `NEXT_PUBLIC_CLERK_FRONTEND_API_URL` | pubblica | origine FAPI esatta ammessa dalla CSP, ad es. `https://clerk.example.it` |
| `CLERK_TELEMETRY_DISABLED` | non sensibile | `1`, disattiva telemetria SDK server in sviluppo |
| `NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED` | pubblica | `1`, disattiva telemetria SDK client in sviluppo |
| `RSVP_ADMIN_EMAILS` | segreta | email ammesse, separate da virgola |

Non copiare segreti in chat, commit, screenshot, ticket o file sotto `public/`.
Le variabili Preview devono usare database e istanza auth separati dalla
produzione.

## Ruolo Neon runtime

Creare il ruolo dell'app dal SQL Editor del branch corretto, non dal pannello
Roles: i ruoli creati via SQL non ereditano automaticamente `neon_superuser`.
Usare password diverse per Development e Production e non riutilizzare mai la
password del proprietario `neondb_owner`.

Eseguire una sola volta con l'utente proprietario. La password viene generata
nel database e non compare nel testo della query:

```sql
create temporary table site_love_new_credential as
select
  replace(gen_random_uuid()::text, '-', '') ||
  replace(gen_random_uuid()::text, '-', '') as password;

do $$
declare
  generated_password text;
begin
  select password
  into generated_password
  from site_love_new_credential;

  execute format(
    'create role site_love_app login password %L',
    generated_password
  );
end
$$;

do $$
begin
  execute format(
    'grant connect on database %I to site_love_app',
    current_database()
  );
end
$$;
```

Concedere soltanto i privilegi usati dal sito:

```sql
grant usage on schema rsvp to site_love_app;

grant select on rsvp.households to site_love_app;
grant update (
  response_version,
  updated_at,
  submission_window_started_at,
  submission_count
) on rsvp.households to site_love_app;

grant select on rsvp.invitees to site_love_app;

grant select on rsvp.responses to site_love_app;
grant insert (
  household_id,
  invitee_id,
  attendance,
  meal_preference,
  updated_at
) on rsvp.responses to site_love_app;
grant update (
  attendance,
  meal_preference,
  updated_at
) on rsvp.responses to site_love_app;

grant insert (
  household_id,
  event_type,
  metadata
) on rsvp.audit_events to site_love_app;
grant select (id) on rsvp.audit_events to site_love_app;

grant insert (
  actor_id,
  event_type,
  metadata
) on rsvp.admin_events to site_love_app;

grant usage, select on all sequences in schema rsvp to site_love_app;

alter role site_love_app set statement_timeout = '10s';
alter role site_love_app set lock_timeout = '3s';
alter role site_love_app
  set idle_in_transaction_session_timeout = '15s';

select password as "COPIA QUESTA PASSWORD E NON CONDIVIDERLA"
from site_love_new_credential;
```

Dopo avere copiato la password, eliminare la tabella temporanea e verificare
che il ruolo non abbia privilegi amministrativi:

```sql
drop table site_love_new_credential;

select
  rolname,
  rolcanlogin,
  rolsuper,
  rolcreatedb,
  rolcreaterole,
  pg_has_role(
    'site_love_app',
    'neon_superuser',
    'member'
  ) as membro_neon_superuser
from pg_roles
where rolname = 'site_love_app';
```

Solo `rolcanlogin` deve essere `true`; gli altri quattro controlli devono
essere `false`. Se il ruolo SQL non appare nel menu Connect, costruire la
stringa usando l'hostname pooled del branch e le credenziali di
`site_love_app`; non usare né reimpostare `neondb_owner`.

Il generatore degli inviti inserisce nuclei e invitati e va quindi eseguito con
una connessione operativa separata e temporanea che abbia anche `insert` su
`households` e `invitees`. Non dare tali privilegi all'app pubblicata.

## Lista privata e QR

Il file JSON deve stare fuori dalla cartella del progetto:

```json
[
  {
    "householdName": "Famiglia Esempio",
    "locale": "it",
    "deadline": "2028-03-31T23:59:59+02:00",
    "invitedBy": "groom",
    "invitees": ["Ada Esempio", "Teo Esempio"]
  }
]
```

`invitedBy` è obbligatorio per ogni nucleo e accetta `bride`, `groom` oppure
`both`. Tutte le persone dello stesso oggetto condividono nucleo, provenienza,
link e QR.

Con il dominio definitivo e la connessione operativa caricati nella shell:

```bash
npm run create:rsvp-invitations -- /percorso/privato/invitati.json
```

Il comando usa token casuali da 256 bit, salva nel database soltanto SHA-256,
genera PNG locali con correzione errore alta e crea un `manifest.csv` con link
personali. Input e output dentro il repository vengono rifiutati. Manifest e QR
vanno conservati cifrati e non caricati su Drive condivisi pubblicamente.

## Checklist di lancio

- [ ] Dominio definitivo e redirect canonico HTTPS funzionanti.
- [ ] CSP aggiornata con l'origine FAPI Clerk di produzione.
- [ ] Account Clerk reclamato, registrazione pubblica disabilitata, MFA attiva per gli sposi.
- [ ] `RSVP_ADMIN_EMAILS` contiene soltanto gli amministratori reali.
- [ ] Migrazioni applicate e ruolo runtime a privilegi minimi.
- [ ] Turnstile verifica dominio e action `rsvp_submit`.
- [ ] Informativa privacy completata con contatto, base giuridica e fornitori.
- [ ] Test di presenza/assenza, modifica concorrente, scadenza, token revocato e rate limit.
- [ ] Export CSV aperto in Numbers/Excel senza formule eseguibili.
- [ ] Backup creato e ripristinato in un branch Neon separato.
- [ ] Nessun nome, token, QR, dump o export presente in Git, `public/`, log o analytics.
- [ ] Ogni QR stampato abbinato manualmente al nucleo corretto.
