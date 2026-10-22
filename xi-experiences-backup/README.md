# XI Experiences — code backup

- Source: ShaunXI/xi-experiences `main` @ db23ba7, plus the new six-event `events.php`, the recovered `admin/` folder, and 10 restored fleet thumbnails in `assets/fleet/` (from commit d9bd078).
- Date of backup: Oct 22, 2026.

## Excluded (this repo is public)
- `admin/config.php` (admin email and password hash). Use `admin/config.example.php` as the template.
- `io/fub-config.php` (CRM/API credentials).
- Any `.env` files.
- `data/events.lock` (a runtime lock file).
- Files that exist only on the live server. The hosting connector can't read them reliably.

## Note
This is a code backup only. The PHP pages (`events.php`, `events-feed.php`, `admin/`, `inc/`) won't run on GitHub Pages. Only the static HTML, CSS and JS will render here.
