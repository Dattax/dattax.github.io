# XI Members Club (prototype)

Invitation-only teal members web app for the GitHub Pages house. **Front-end only.** Auth, RSVPs, and access requests live in `localStorage` on this browser — no real accounts, mail, or SMS. Pending a real auth backend.

Live path: `/members/`

## Pages

- `index.html` — coming soon. Request access / Member login, or Enter club if a session is open.
- `request-access.html` — ask to be written in (stores a pending request).
- `login.html` — member login.
- `app.html` — member home.
- `events.html` / `event.html?id=` — season list and detail with RSVP.
- `profile.html` — name, phone, SMS opt-in stub.
- `admin.html` — admin only. Headcounts and pending requests.

← House returns to the marketing site (`/`).

## Demo

- Member: `member@xi.test` / `member`
- Admin: `admin@xi.test` / `admin`

## Stack

- `styles.css` — teal world (Cormorant Garamond + Jost)
- `app.js` — mock auth, events, RSVPs, requests
