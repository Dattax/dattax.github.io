# XI Members

Client-side members house for the GitHub Pages site. No server, no live Stripe, no live SMS.

Live path: `/members/`

## Banner

Every members page injects a sticky bar: **Members Only**.

## Roles

- **Guest** — request access (`request-access.html`). The desk approves.
- **Member** — sign in, see credits, browse nights with cover photos, RSVP, guest list, upload media, pay with a Stripe-style mock or Payment Link placeholder, propose a night.
- **Admin** — approve access, create events, chip a theme, publish. **Admin publishes; members only propose.**

## Pages

- `index.html` — gate when signed out; home (balance + next nights) when signed in
- `request-access.html` — ask to be written in
- `login.html` — sign in; House desk fills the admin key
- `events.html` — published nights, city filter, photo cards
- `event.html?id=` — cover, RSVP, guest list, media, pay
- `credits.html` — balance, ledger, buy packs
- `propose.html` — member propose (desk publishes)
- `admin.html` — access queue, create/design/publish
- `calendar.html` — redirects to `events.html`
- `signup.html` / `reset.html` — local join / new key

## Demo keys

| Role | Email | Key |
| --- | --- | --- |
| Member | `member@xi.demo` | `xi-demo-2026` |
| Desk | `admin@xi.demo` | `xi-admin-2026` |

Seeded into `localStorage` on first visit. Approving a request creates a local member (`xi-guest-2026`) with three credits.

## Stack

- `css/members.css` — club chrome on the house styles
- `js/store.js` — users, session, requests, events, RSVPs, guests, media, ledger, proposals
- `js/auth.js` — sign in, join, request, approve, credits
- `js/ui.js` — banner, nav, dock (Home / Events / Credits / You / Admin)
- `js/club.js` — nights, RSVP, pay mock, propose, admin desk
- `assets/` — cover stills (rooftop, Hamptons, Miami, dining, night, house, music)

## Brand

`--ink` `#070a0a`, `--field` `#0c1212`, `--petrol` `#194141`, `--deep` `#2c666a`, `--teal` `#40b0c0`, `--teal-mid` `#34909d`, `--sand` `#e7c3ac`, `--gold` `#d7944e`, `--cream` `#e8dcc4`, `--mute` `#8a9a96`. Cormorant Garamond + Jost.
