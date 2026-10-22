<?php
/**
 * XI Experiences — events admin (single password).
 * Password hash lives in admin/config.php (see instructions there).
 * Data: data/events.json. Uploads: assets/events/.
 */
declare(strict_types=1);
require __DIR__ . '/../inc/xi-events.php';
$config = require __DIR__ . '/config.php';

const XI_ATTEMPTS_FILE = XI_ROOT . '/data/login-attempts.json';

/* ---------- headers: never cache, never frame, never index ---------- */
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
header('Pragma: no-cache');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'");

/* ---------- session ---------- */
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');
session_name('xi_admin');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/admin/index.php')), '/') . '/',
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}
$idle = max(5, (int)($config['idle_minutes'] ?? 120)) * 60;
if (!empty($_SESSION['auth']) && (time() - (int)($_SESSION['seen'] ?? 0)) > $idle) {
    $_SESSION = ['csrf' => bin2hex(random_bytes(32)), 'flash' => ['err', 'Signed out after inactivity.']];
    session_regenerate_id(true);
}
if (!empty($_SESSION['auth'])) {
    $_SESSION['seen'] = time();
}
$authed = !empty($_SESSION['auth']);

/* ---------- helpers ---------- */
function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . xi_e($_SESSION['csrf']) . '">';
}
function flash(string $type, string $msg): void
{
    $_SESSION['flash'] = [$type, $msg];
}
function go(string $qs = ''): never
{
    header('Location: ./' . ($qs !== '' ? '?' . $qs : ''), true, 303);
    exit;
}
function admin_img_src(string $img): string
{
    return preg_match('#^https://#i', $img) ? $img : '../' . $img;
}
function client_key(): string
{
    return hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
}

/** File-based login throttle. $fn gets &$all (key => record) and returns a value. */
function attempts(callable $fn)
{
    $fh = fopen(XI_ATTEMPTS_FILE, 'c+');
    if ($fh === false) {
        throw new RuntimeException('Cannot open data/login-attempts.json. Is data/ writable?');
    }
    flock($fh, LOCK_EX);
    $all = json_decode((string)stream_get_contents($fh), true);
    $all = is_array($all) ? $all : [];
    $now = time();
    foreach ($all as $k => $r) {   // prune stale records
        if (($r['locked_until'] ?? 0) < $now && ($r['first'] ?? 0) < $now - 86400) {
            unset($all[$k]);
        }
    }
    $ret = $fn($all);
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($all));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ret;
}

function page_open(string $title, bool $authed): void
{
    ?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title><?= xi_e($title) ?> — XI Events Admin</title>
  <link rel="icon" href="../assets/favicon.png" type="image/png">
  <meta name="theme-color" content="#070a0a">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/site.css?v=xi-logo-1">
  <link rel="stylesheet" href="admin.css?v=2">
  <script src="admin.js?v=1" defer></script>
</head>
<body class="xi-admin<?= $authed ? '' : ' is-login' ?>">
<?php if ($authed): ?>
  <header class="adm-bar">
    <a class="adm-mark" href="./" aria-label="Events admin home"><img src="../assets/logo-hero.svg" width="54" height="40" alt="XI"></a>
    <span class="eyebrow adm-title">Events admin</span>
    <nav class="adm-nav">
      <a href="../events.php" target="_blank" rel="noopener">View site</a>
      <form method="post" action="./">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="logout">
        <button class="cta" type="submit">Log out</button>
      </form>
    </nav>
  </header>
<?php endif; ?>
  <main class="adm-main">
<?php
    if (!empty($_SESSION['flash'])) {
        [$t, $m] = $_SESSION['flash'];
        unset($_SESSION['flash']);
        echo '    <p class="adm-flash ' . ($t === 'ok' ? 'is-ok' : 'is-err') . '" role="status">' . xi_e($m) . "</p>\n";
    }
}

function page_close(): void
{
    echo "  </main>\n</body>\n</html>\n";
}

function remove_upload_if_unused(string $img, array $events): void
{
    if (strpos($img, XI_UPLOAD_URL) !== 0) {
        return;   // only ever delete our own uploads
    }
    foreach ($events as $ev) {
        if (($ev['image'] ?? '') === $img) {
            return;
        }
    }
    $path = XI_UPLOAD_DIR . '/' . basename($img);
    if (is_file($path)) {
        @unlink($path);
    }
}

/** Validate + store an uploaded image. Returns [path|null, error|null]. */
function handle_upload(array $f): array
{
    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return [null, null];
    }
    if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) {
        return [null, 'Image is too large (max 5 MB).'];
    }
    if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        return [null, 'Image upload failed. Please try again.'];
    }
    if ($f['size'] > XI_MAX_UPLOAD) {
        return [null, 'Image is too large (max 5 MB).'];
    }
    $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $info = @getimagesize($f['tmp_name']);
    if (!isset($types[$mime]) || !$info || ($info['mime'] ?? '') !== $mime) {
        return [null, 'Image must be a JPG, PNG or WebP file.'];
    }
    if (!is_dir(XI_UPLOAD_DIR) && !mkdir(XI_UPLOAD_DIR, 0755, true)) {
        return [null, 'assets/events/ is missing and could not be created.'];
    }
    $name = bin2hex(random_bytes(12)) . '.' . $types[$mime];
    if (!move_uploaded_file($f['tmp_name'], XI_UPLOAD_DIR . '/' . $name)) {
        return [null, 'Could not save the image. Is assets/events/ writable?'];
    }
    @chmod(XI_UPLOAD_DIR . '/' . $name, 0644);
    return [XI_UPLOAD_URL . $name, null];
}

function blank_event(): array
{
    return ['id' => '', 'title' => '', 'date' => '', 'time' => '', 'location' => 'NYC', 'description' => '',
            'image' => '', 'cta_url' => '', 'cta_label' => '', 'published' => true];
}

function render_form(array $ev, array $errors): void
{
    $isNew = $ev['id'] === '';
    page_open($isNew ? 'New event' : 'Edit event', true);
    $images = xi_existing_images();
    ?>
    <div class="adm-head">
      <p class="eyebrow"><a href="./">&larr; All events</a></p>
      <h1 class="display"><?= $isNew ? 'New<br><em>event.</em>' : 'Edit<br><em>event.</em>' ?></h1>
    </div>
<?php if ($errors): ?>
    <div class="adm-flash is-err" role="alert"><p>Please fix:</p><ul><?php foreach ($errors as $er) { echo '<li>' . xi_e($er) . '</li>'; } ?></ul></div>
<?php endif; ?>
    <form class="form adm-form" method="post" action="./" enctype="multipart/form-data" novalidate>
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= xi_e($ev['id']) ?>">
      <input type="hidden" name="MAX_FILE_SIZE" value="<?= XI_MAX_UPLOAD ?>">

      <div class="field adm-span">
        <label for="f-title">Title *</label>
        <input id="f-title" name="title" type="text" maxlength="120" required value="<?= xi_e($ev['title']) ?>" placeholder="XI Casino Night">
      </div>
      <div class="field">
        <label for="f-date">Date *</label>
        <input id="f-date" name="date" type="date" required value="<?= xi_e($ev['date']) ?>">
      </div>
      <div class="field">
        <label for="f-time">Time</label>
        <input id="f-time" name="time" type="text" maxlength="60" value="<?= xi_e($ev['time']) ?>" placeholder="7 – 11 PM">
      </div>
      <div class="field adm-span">
        <label for="f-loc">Location / venue</label>
        <input id="f-loc" name="location" type="text" maxlength="80" value="<?= xi_e($ev['location']) ?>" placeholder="NYC">
      </div>
      <div class="field adm-span">
        <label for="f-desc">Short description</label>
        <textarea id="f-desc" name="description" rows="3" maxlength="600" placeholder="Blackjack + poker + roulette + cocktails + prizes"><?= xi_e($ev['description']) ?></textarea>
      </div>

      <fieldset class="adm-span adm-image">
        <legend class="eyebrow">Image (optional)</legend>
<?php if ($ev['image'] !== ''): ?>
        <figure class="adm-preview"><img src="<?= xi_e(admin_img_src($ev['image'])) ?>" alt=""><figcaption><?= xi_e($ev['image']) ?></figcaption></figure>
        <label class="adm-check"><input type="checkbox" name="remove_image" value="1"> Remove image</label>
<?php endif; ?>
        <div class="field">
          <label for="f-upload">Upload JPG, PNG or WebP (max 5 MB)</label>
          <input id="f-upload" name="upload" type="file" accept="image/jpeg,image/png,image/webp">
        </div>
        <div class="field">
          <label for="f-image">…or use an existing image path / https URL</label>
          <input id="f-image" name="image" type="text" maxlength="500" list="img-list" value="<?= xi_e($ev['image']) ?>" placeholder="assets/service-night.jpg">
          <datalist id="img-list"><?php foreach ($images as $im) { echo '<option value="' . xi_e($im) . '">'; } ?></datalist>
        </div>
      </fieldset>

      <div class="field">
        <label for="f-cta">RSVP / button link</label>
        <input id="f-cta" name="cta_url" type="text" maxlength="500" value="<?= xi_e($ev['cta_url']) ?>" placeholder="https://… or contact.html">
      </div>
      <div class="field">
        <label for="f-ctal">Button label</label>
        <input id="f-ctal" name="cta_label" type="text" maxlength="40" value="<?= xi_e($ev['cta_label']) ?>" placeholder="RSVP">
      </div>

      <label class="adm-check adm-span adm-pub"><input type="checkbox" name="published" value="1"<?= !empty($ev['published']) ? ' checked' : '' ?>> Published (visible on the Events page)</label>

      <div class="form-actions adm-span">
        <button class="cta cta-solid" type="submit"><?= $isNew ? 'Create event' : 'Save changes' ?></button>
        <a class="adm-link" href="./">Cancel</a>
      </div>
    </form>
<?php
    page_close();
}

function render_list(): void
{
    page_open('Events', true);
    $events = xi_sort_events(xi_load_events());
    $upcoming = array_values(array_filter($events, fn($e) => !xi_is_past($e)));
    $past = array_reverse(array_values(array_filter($events, 'xi_is_past')));
    ?>
    <div class="adm-head adm-head-row">
      <div>
        <p class="eyebrow">Season 2026</p>
        <h1 class="display">Events<em>.</em></h1>
      </div>
      <a class="cta cta-solid" href="?action=new">+ New event</a>
    </div>
<?php
    foreach (['Upcoming' => $upcoming, 'Past (hidden from the site)' => $past] as $label => $group) {
        echo '    <section class="adm-group">' . "\n" . '      <h2 class="eyebrow">' . xi_e($label) . ' · ' . count($group) . "</h2>\n";
        if (!$group) {
            echo "      <p class=\"adm-empty\">Nothing here.</p>\n";
        }
        foreach ($group as $ev) {
            $pub = !empty($ev['published']);
            $id = (string)($ev['id'] ?? '');
            ?>
      <article class="adm-row<?= $pub ? '' : ' is-draft' ?>">
        <div class="adm-when"><span class="eyebrow"><?= xi_e(xi_month_label((string)$ev['date'])) ?></span><span class="adm-date"><?= xi_e(xi_date_label($ev)) ?></span></div>
        <div class="adm-what">
          <h3><?= xi_e($ev['title'] ?? '') ?></h3>
          <p><?= xi_e($ev['location'] ?? '') ?><?= !empty($ev['image']) ? ' · image' : '' ?><?= !empty($ev['cta_url']) ? ' · link' : '' ?></p>
        </div>
        <span class="adm-pill <?= $pub ? 'is-on' : 'is-off' ?>"><?= $pub ? 'Published' : 'Draft' ?></span>
        <div class="adm-actions">
          <a class="adm-btn" href="?action=edit&amp;id=<?= xi_e(rawurlencode($id)) ?>">Edit</a>
          <form method="post" action="./"><?= csrf_field() ?><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= xi_e($id) ?>"><button class="adm-btn" type="submit"><?= $pub ? 'Unpublish' : 'Publish' ?></button></form>
          <form method="post" action="./" data-confirm="Delete “<?= xi_e($ev['title'] ?? '') ?>”? This cannot be undone."><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= xi_e($id) ?>"><button class="adm-btn is-danger" type="submit">Delete</button></form>
        </div>
      </article>
<?php
        }
        echo "    </section>\n";
    }
    page_close();
}

function render_login(string $error, bool $configured): void
{
    page_open('Sign in', false);
    ?>
    <div class="adm-login">
      <img class="adm-login-mark" src="../assets/logo-hero.svg" width="86" height="64" alt="XI">
      <p class="eyebrow">XI Experiences</p>
      <h1 class="display">Events<br><em>admin.</em></h1>
<?php if (!$configured): ?>
      <p class="adm-flash is-err">No admin password is set yet. Add a password hash to <code>admin/config.php</code> (instructions are at the top of that file).</p>
<?php else: ?>
<?php if ($error !== ''): ?>
      <p class="adm-flash is-err" role="alert"><?= xi_e($error) ?></p>
<?php endif; ?>
      <form class="form" method="post" action="./">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="login">
        <div class="field">
          <label for="em">Email</label>
          <input id="em" name="email" type="email" autocomplete="username" required autofocus>
        </div>
        <div class="field">
          <label for="pw">Password</label>
          <input id="pw" name="password" type="password" autocomplete="current-password" required>
        </div>
        <div class="form-actions"><button class="cta cta-solid" type="submit">Enter</button></div>
      </form>
<?php endif; ?>
      <p class="adm-foot"><a href="../index.html">&larr; Back to site</a></p>
    </div>
<?php
    page_close();
}

function render_error(int $code, string $msg): never
{
    http_response_code($code);
    page_open('Error', !empty($_SESSION['auth']));
    echo '    <div class="adm-login"><p class="eyebrow">Error ' . $code . '</p><p class="adm-flash is-err">' . xi_e($msg) . '</p><p><a class="cta" href="./">Back to admin</a></p></div>' . "\n";
    page_close();
    exit;
}

/* ---------- request handling ---------- */
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $method === 'POST' ? (string)($_POST['action'] ?? '') : (string)($_GET['action'] ?? '');

try {
    if ($method === 'POST') {
        if (empty($_POST) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
            render_error(413, 'That upload was larger than the server allows. Images must be 5 MB or less.');
        }
        if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['csrf'], $_POST['csrf'])) {
            render_error(403, 'This form expired or is invalid (security token mismatch). Go back, reload the page and try again.');
        }
    }

    /* --- not signed in: only login --- */
    if (!$authed) {
        $configured = is_string($config['password_hash'] ?? null) && str_starts_with($config['password_hash'], '$');
        $error = '';
        if ($method === 'POST' && $action === 'login' && $configured) {
            $key = client_key();
            $max = max(1, (int)($config['max_attempts'] ?? 5));
            $win = max(1, (int)($config['lockout_minutes'] ?? 15)) * 60;
            $lockedFor = attempts(function (&$all) use ($key) {
                $r = $all[$key] ?? [];
                return max(0, (int)($r['locked_until'] ?? 0) - time());
            });
            if ($lockedFor > 0) {
                $error = 'Too many failed attempts. Try again in ' . (int)ceil($lockedFor / 60) . ' minute(s).';
            } elseif (hash_equals(strtolower(trim((string)($config['admin_email'] ?? ''))), strtolower(trim((string)($_POST['email'] ?? '')))) & password_verify((string)($_POST['password'] ?? ''), $config['password_hash'])) {
                attempts(function (&$all) use ($key) { unset($all[$key]); });
                session_regenerate_id(true);
                $_SESSION['auth'] = true;
                $_SESSION['seen'] = time();
                $_SESSION['csrf'] = bin2hex(random_bytes(32));
                flash('ok', 'Signed in.');
                go();
            } else {
                usleep(random_int(300000, 700000));
                $locked = attempts(function (&$all) use ($key, $max, $win) {
                    $now = time();
                    $r = $all[$key] ?? ['fails' => 0, 'first' => $now, 'locked_until' => 0];
                    if ($r['first'] < $now - $win) {
                        $r = ['fails' => 0, 'first' => $now, 'locked_until' => 0];
                    }
                    $r['fails']++;
                    $hit = $r['fails'] >= $max;
                    if ($hit) {
                        $r = ['fails' => 0, 'first' => $now, 'locked_until' => $now + $win];
                    }
                    $all[$key] = $r;
                    return $hit;
                });
                $error = $locked
                    ? 'Too many failed attempts. Login is locked for ' . (int)($win / 60) . ' minutes.'
                    : 'Wrong email or password.';
            }
        }
        if ($error !== '') {
            http_response_code(401);
        }
        render_login($error, $configured);
        exit;
    }

    /* --- signed in --- */
    if ($method === 'POST') {
        $id = (string)($_POST['id'] ?? '');
        switch ($action) {
            case 'logout':
                $_SESSION = [];
                $p = session_get_cookie_params();
                setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Strict']);
                session_destroy();
                header('Location: ./', true, 303);
                exit;

            case 'toggle':
                $title = null;
                xi_update_events(function ($events) use ($id, &$title) {
                    foreach ($events as &$ev) {
                        if (($ev['id'] ?? '') === $id) {
                            $ev['published'] = empty($ev['published']);
                            $ev['updated'] = date('c');
                            $title = $ev['title'] . ($ev['published'] ? ' is published.' : ' is now a draft (hidden).');
                        }
                    }
                    return $events;
                });
                $title ? flash('ok', $title) : flash('err', 'Event not found.');
                go();

            case 'delete':
                $gone = null;
                $events = xi_update_events(function ($events) use ($id, &$gone) {
                    return array_values(array_filter($events, function ($ev) use ($id, &$gone) {
                        if (($ev['id'] ?? '') === $id) { $gone = $ev; return false; }
                        return true;
                    }));
                });
                if ($gone) {
                    remove_upload_if_unused((string)($gone['image'] ?? ''), $events);
                    flash('ok', 'Deleted “' . $gone['title'] . '”.');
                } else {
                    flash('err', 'Event not found.');
                }
                go();

            case 'save':
                $in = [
                    'id'          => $id,
                    'title'       => trim((string)($_POST['title'] ?? '')),
                    'date'        => trim((string)($_POST['date'] ?? '')),
                    'time'        => trim((string)($_POST['time'] ?? '')),
                    'location'    => trim((string)($_POST['location'] ?? '')),
                    'description' => trim(str_replace("\r\n", "\n", (string)($_POST['description'] ?? ''))),
                    'image'       => trim((string)($_POST['image'] ?? '')),
                    'cta_url'     => trim((string)($_POST['cta_url'] ?? '')),
                    'cta_label'   => trim((string)($_POST['cta_label'] ?? '')),
                    'published'   => !empty($_POST['published']),
                ];
                $existing = null;
                if ($id !== '') {
                    foreach (xi_load_events() as $ev) {
                        if (($ev['id'] ?? '') === $id) { $existing = $ev; }
                    }
                    if (!$existing) { flash('err', 'Event not found.'); go(); }
                }
                $err = [];
                $len = fn($s) => xi_strlen($s);
                if ($in['title'] === '' || $len($in['title']) > 120) $err[] = 'Title is required (max 120 characters).';
                if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $in['date'], $m) || !checkdate((int)$m[2], (int)$m[3], (int)$m[1])) $err[] = 'Date is required (YYYY-MM-DD).';
                if ($len($in['time']) > 60) $err[] = 'Time is too long (max 60).';
                if ($len($in['location']) > 80) $err[] = 'Location is too long (max 80).';
                if ($len($in['description']) > 600) $err[] = 'Description is too long (max 600).';
                if ($len($in['cta_label']) > 40) $err[] = 'Button label is too long (max 40).';
                if ($len($in['cta_url']) > 500 || !xi_safe_url($in['cta_url'])) $err[] = 'Link must start with https://, http://, mailto:, or be a page on this site (e.g. contact.html).';
                if (!empty($_POST['remove_image'])) $in['image'] = '';
                if ($len($in['image']) > 500 || !xi_safe_image($in['image'])) $err[] = 'Image must be a site path like assets/photo.jpg or an https:// URL.';

                if (!$err) {
                    [$up, $upErr] = handle_upload($_FILES['upload'] ?? []);
                    if ($upErr) $err[] = $upErr;
                    if ($up) $in['image'] = $up;
                }
                if ($err) {
                    http_response_code(422);
                    render_form($in, $err);
                    exit;
                }

                $in['updated'] = date('c');
                $oldImage = (string)($existing['image'] ?? '');
                if ($id === '') {
                    $in['id'] = bin2hex(random_bytes(6));
                }
                $events = xi_update_events(function ($events) use ($in) {
                    $found = false;
                    foreach ($events as &$ev) {
                        if (($ev['id'] ?? '') === $in['id']) { $ev = array_merge($ev, $in); $found = true; }
                    }
                    unset($ev);
                    if (!$found) $events[] = $in;
                    return $events;
                });
                if ($oldImage !== '' && $oldImage !== $in['image']) {
                    remove_upload_if_unused($oldImage, $events);
                }
                flash('ok', ($id === '' ? 'Created “' : 'Saved “') . $in['title'] . '”' . ($in['published'] ? '.' : ' (draft, not visible on the site).'));
                go();

            default:
                render_error(400, 'Unknown action.');
        }
    }

    if ($action === 'new') {
        render_form(blank_event(), []);
    } elseif ($action === 'edit') {
        $id = (string)($_GET['id'] ?? '');
        $found = null;
        foreach (xi_load_events() as $ev) {
            if (($ev['id'] ?? '') === $id) { $found = $ev; }
        }
        if (!$found) render_error(404, 'Event not found.');
        render_form(array_merge(blank_event(), $found), []);
    } else {
        render_list();
    }
} catch (Throwable $e) {
    error_log('XI admin: ' . $e->getMessage());
    // Our own RuntimeExceptions are setup hints (e.g. "Is data/ writable?"); hide anything else from visitors.
    $show = !empty($_SESSION['auth']) || $e instanceof RuntimeException;
    render_error(500, $show ? 'Something went wrong: ' . $e->getMessage() : 'Something went wrong. Please try again later.');
}
