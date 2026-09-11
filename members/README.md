# XI Members (prototype)

Client-side members area for the GitHub Pages house. **Not live.** No server, no real SMS, no real mail.

Live path: `/members/`

## Banner

Every members page injects a sticky bar: **PROTOTYPE — NOT LIVE**.

## Pages

- `index.html` — gate. Signed-in visitors go to the calendar.
- `request-access.html` — ask to be written in (stored in this browser).
- `signup.html` — join if you were asked (local account).
- `login.html` — sign in.
- `reset.html` — set a new key for an address already on this browser’s list.
- `calendar.html` — month book + **Text me a reminder** (mock SMS). Requires a session.

## Demo key

`member@xi.demo` / `xi-demo-2026`

Seeded into `localStorage` on first visit. Signing up creates another local account on this device only.

## Stack

- `css/members.css` — members chrome on top of the house styles
- `js/store.js` — `localStorage` users, session, requests, reminders
- `js/auth.js` — sign in, join, request, reset
- `js/ui.js` — banner, nav, session, forms
- `js/calendar.js` — month grid and mock SMS
- `assets/logo-hero.svg` — copy of the house mark

## Brand

Black `#070a0a`, teal `#40b0c0`, sand `#e7c3ac`. Cormorant Garamond + Jost. Invitation, not a product page.
