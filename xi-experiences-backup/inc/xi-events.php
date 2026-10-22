<?php
/**
 * XI events — shared data layer.
 * Used by events.php (public page), events-feed.php (public JSON) and admin/index.php.
 * This folder is blocked from the web by inc/.htaccess; PHP includes it from disk.
 */
declare(strict_types=1);

date_default_timezone_set('America/New_York');

const XI_ROOT        = __DIR__ . '/..';
const XI_DATA_FILE   = XI_ROOT . '/data/events.json';
const XI_LOCK_FILE   = XI_ROOT . '/data/events.lock';
const XI_UPLOAD_DIR  = XI_ROOT . '/assets/events';
const XI_UPLOAD_URL  = 'assets/events/';           // relative to the site root
const XI_MAX_UPLOAD  = 5 * 1024 * 1024;            // 5 MB

/** HTML-escape for output. */
function xi_e(?string $s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** UTF-8 character count without requiring the mbstring extension. */
function xi_strlen(string $s): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($s, 'UTF-8');
    }
    $n = preg_match_all('/./us', $s);
    return $n === false ? strlen($s) : $n;
}

/** Open (creating) the lock file and take a lock on it. */
function xi_lock(int $mode)
{
    $fh = fopen(XI_LOCK_FILE, 'c');
    if ($fh === false) {
        throw new RuntimeException('Cannot open lock file. Is data/ writable?');
    }
    flock($fh, $mode);
    return $fh;
}

function xi_unlock($fh): void
{
    flock($fh, LOCK_UN);
    fclose($fh);
}

/** Read all events (unsorted, including drafts). */
function xi_read_events_unlocked(): array
{
    if (!is_file(XI_DATA_FILE)) {
        return [];
    }
    $raw = file_get_contents(XI_DATA_FILE);
    $data = json_decode((string)$raw, true);
    if (!is_array($data)) {
        return [];
    }
    $list = isset($data['events']) && is_array($data['events']) ? $data['events'] : $data;
    return array_values(array_filter($list, 'is_array'));
}

function xi_load_events(): array
{
    // Writers replace the file atomically (rename), so a reader can never see a half-written
    // file. The shared lock is a nicety; if data/ is read-only for this process, read anyway.
    $fh = @fopen(XI_LOCK_FILE, 'c');
    if ($fh === false) {
        return xi_read_events_unlocked();
    }
    flock($fh, LOCK_SH);
    try {
        return xi_read_events_unlocked();
    } finally {
        xi_unlock($fh);
    }
}

/** Atomic write: temp file in the same dir, then rename(). Caller must hold LOCK_EX. */
function xi_write_events_unlocked(array $events): void
{
    $json = json_encode(
        ['events' => array_values($events)],
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    if ($json === false) {
        throw new RuntimeException('Could not encode events.');
    }
    $tmp = XI_DATA_FILE . '.tmp-' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $json . "\n", LOCK_EX) === false) {
        throw new RuntimeException('Could not write data/. Is it writable?');
    }
    @chmod($tmp, 0644);
    if (!rename($tmp, XI_DATA_FILE)) {
        @unlink($tmp);
        throw new RuntimeException('Could not replace data/events.json.');
    }
}

/**
 * Read-modify-write under an exclusive lock.
 * $fn receives the current event list and returns the new list.
 */
function xi_update_events(callable $fn): array
{
    $fh = xi_lock(LOCK_EX);
    try {
        $events = xi_read_events_unlocked();
        $new = $fn($events);
        xi_write_events_unlocked($new);
        return $new;
    } finally {
        xi_unlock($fh);
    }
}

function xi_sort_events(array $events): array
{
    usort($events, function ($a, $b) {
        return [$a['date'] ?? '', $a['title'] ?? ''] <=> [$b['date'] ?? '', $b['title'] ?? ''];
    });
    return $events;
}

function xi_today(): string
{
    return date('Y-m-d');
}

function xi_is_past(array $ev): bool
{
    return ($ev['date'] ?? '') < xi_today();
}

/** "Oct 2026" */
function xi_month_label(string $date): string
{
    $t = strtotime($date . ' 12:00');
    return $t ? date('M Y', $t) : '';
}

/** "Thu 10/22" (+ " · 7 PM" when a time is set) */
function xi_date_label(array $ev): string
{
    $t = strtotime(($ev['date'] ?? '') . ' 12:00');
    $label = $t ? date('D n/j', $t) : '';
    $time = trim((string)($ev['time'] ?? ''));
    return $time !== '' ? ($label . ' · ' . $time) : $label;
}

/** Only what the public may see: published events, sorted by date. */
function xi_public_events(bool $upcomingOnly = false): array
{
    $out = [];
    foreach (xi_sort_events(xi_load_events()) as $ev) {
        if (empty($ev['published'])) {
            continue;
        }
        $past = xi_is_past($ev);
        if ($upcomingOnly && $past) {
            continue;
        }
        $out[] = [
            'id'          => (string)($ev['id'] ?? ''),
            'title'       => (string)($ev['title'] ?? ''),
            'date'        => (string)($ev['date'] ?? ''),
            'time'        => (string)($ev['time'] ?? ''),
            'location'    => (string)($ev['location'] ?? ''),
            'description' => (string)($ev['description'] ?? ''),
            'image'       => (string)($ev['image'] ?? ''),
            'cta_url'     => (string)($ev['cta_url'] ?? ''),
            'cta_label'   => (string)($ev['cta_label'] ?? ''),
            'month_label' => xi_month_label((string)($ev['date'] ?? '')),
            'date_label'  => xi_date_label($ev),
            'is_past'     => $past,
        ];
    }
    return $out;
}

/** Safe link check: http(s), mailto:, tel:, or a site-relative path. Never javascript:/data:. */
function xi_safe_url(string $url): bool
{
    $url = trim($url);
    if ($url === '') {
        return true;
    }
    if (preg_match('/[\s<>"\']/', $url)) {
        return false;
    }
    if (preg_match('#^https?://#i', $url)) {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
    if (preg_match('#^(mailto|tel):#i', $url)) {
        return true;
    }
    // relative: no scheme at all (e.g. "contact.html", "/members/", "#curate")
    return !preg_match('#^[a-z][a-z0-9+.\-]*:#i', $url) && strpos($url, '//') !== 0;
}

/** Image may be a site asset path (assets/...) or an https URL. */
function xi_safe_image(string $img): bool
{
    $img = trim($img);
    if ($img === '') {
        return true;
    }
    if (preg_match('#^assets/[A-Za-z0-9_\-/]+\.(jpe?g|png|webp|gif|svg)$#i', $img) && strpos($img, '..') === false) {
        return true;
    }
    return (bool)preg_match('#^https://#i', $img) && filter_var($img, FILTER_VALIDATE_URL) !== false
        && !preg_match('/[\s<>"\']/', $img);
}

/** Existing images the admin can pick from (site assets + uploads). */
function xi_existing_images(): array
{
    $out = [];
    foreach (['assets', 'assets/events', 'assets/venues'] as $dir) {
        foreach (glob(XI_ROOT . '/' . $dir . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE) ?: [] as $f) {
            $out[] = $dir . '/' . basename($f);
        }
    }
    return array_values(array_filter($out, fn($p) => !preg_match('#/(grain|favicon)\.#', $p)));
}

/** Render one public card with the existing .night markup. */
function xi_render_night(array $ev): string
{
    $h = "      <article class=\"night\">\n";
    if ($ev['image'] !== '') {
        $h .= '        <figure class="night-img"><img src="' . xi_e($ev['image']) . '" alt="' . xi_e($ev['title']) . "\" loading=\"lazy\"></figure>\n";
    }
    $h .= '        <p class="eyebrow">' . xi_e($ev['month_label']) . "</p>\n";
    $h .= '        <p class="meta">' . xi_e($ev['date_label']) . "</p>\n";
    $h .= '        <h3>' . xi_e($ev['title']) . "</h3>\n";
    if ($ev['location'] !== '') {
        $h .= '        <p class="place">' . xi_e($ev['location']) . "</p>\n";
    }
    if ($ev['description'] !== '') {
        $h .= '        <p class="blurb">' . nl2br(xi_e($ev['description']), false) . "</p>\n";
    }
    if ($ev['cta_url'] !== '' && xi_safe_url($ev['cta_url'])) {
        $label = $ev['cta_label'] !== '' ? $ev['cta_label'] : 'RSVP';
        $ext = preg_match('#^https?://#i', $ev['cta_url']) ? ' target="_blank" rel="noopener"' : '';
        $h .= '        <p class="night-cta"><a class="cta" href="' . xi_e($ev['cta_url']) . '"' . $ext . '>' . xi_e($label) . "</a></p>\n";
    }
    $h .= "      </article>\n";
    return $h;
}

/** "Three nights in New York." — keeps the page lede honest as events pass. */
function xi_nights_lede(array $events): string
{
    $n = count($events);
    if ($n === 0) {
        return 'New dates soon.';
    }
    $words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
    $count = $words[$n] ?? (string)$n;
    $noun = $n === 1 ? 'night' : 'nights';
    $places = array_unique(array_map(fn($e) => strtoupper(trim($e['location'])), $events));
    if ($places === ['NYC'] || $places === ['NEW YORK']) {
        return "$count $noun in New York.";
    }
    return "$count $noun.";
}
