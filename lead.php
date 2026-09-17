<?php
/**
 * XI forms → info@ inbox (temporary).
 * Drop this at the site root on GoDaddy (Linux / PHP hosting).
 * Marketing forms now use mailto:info@ on GitHub Pages; this stays as a
 * fallback if anything still POSTs here. Follow Up Boss is off for now.
 *
 * Requires: PHP mail() enabled (standard on GoDaddy cPanel hosting).
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowedOrigins = [
  'https://dattax.github.io',
  'https://xipremierproductions.com',
  'https://www.xipremierproductions.com',
];
if (in_array($origin, $allowedOrigins, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Accept, Content-Type');
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'POST only']);
  exit;
}

// --- config (edit on GoDaddy if needed) ---
$FUB_TO      = 'info@xipremierproductions.com';
$FROM_EMAIL  = 'info@xipremierproductions.com';
$FROM_NAME   = 'XI Premier Experiences';
$SOURCE      = 'XI Website';
$NOTIFY_COPY = ''; // FUB and shaun@ copy off for now; marketing mail is info@

function field($key) {
  $v = isset($_POST[$key]) ? $_POST[$key] : '';
  if (is_array($v)) $v = '';
  $v = trim(strip_tags((string) $v));
  return $v;
}

function firstEmailIn($text) {
  if (!is_string($text) || $text === '') return '';
  if (preg_match('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $text, $m)) {
    return $m[0];
  }
  return '';
}

// Honeypot — bots fill "company"; humans never see it
if (field('company') !== '') {
  http_response_code(200);
  echo json_encode(['ok' => true]);
  exit;
}

$formTag = field('form_tag');

$tagLabels = [
  'xi-event' => 'Event questionnaire',
  'xi-sponsor' => 'Sponsorship',
  'xi-members-request' => 'Members request',
];
$tagLabel = isset($tagLabels[$formTag]) ? $tagLabels[$formTag] : ($formTag !== '' ? $formTag : 'Website');
$source = $SOURCE . ' — ' . $tagLabel;

$name = field('name');
if ($name === '') $name = field('contact-name');
if ($name === '') $name = field('event-host');
if ($name === '') $name = field('host');
if ($name === '') $name = field('event-name');

$email = field('email');
$phone = field('phone');
$message = isset($_POST['message']) ? trim((string) $_POST['message']) : '';
$message = str_replace(["\r\n", "\r"], "\n", strip_tags($message));

if ($email === '') {
  foreach ($_POST as $val) {
    if (is_array($val)) continue;
    $found = firstEmailIn(strip_tags((string) $val));
    if ($found !== '') {
      $email = $found;
      break;
    }
  }
}

$skipKeys = ['company', 'form_tag', 'name', 'email', 'phone', 'message'];
$extraLines = [];
foreach ($_POST as $key => $val) {
  if (in_array($key, $skipKeys, true)) continue;
  if (is_array($val)) continue;
  $v = trim(strip_tags((string) $val));
  $v = str_replace(["\r\n", "\r"], "\n", $v);
  $extraLines[] = $key . ': ' . $v;
}

if ($email === '' && $formTag === 'xi-event') {
  $email = $FROM_EMAIL;
  $extraLines[] = 'email: (not provided — using house address so the inbox still receives the form)';
}

if ($name === '' || $email === '') {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Name and email are required.']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Enter a valid email.']);
  exit;
}

// Cap lengths
$name    = mb_substr($name, 0, 120);
$email   = mb_substr($email, 0, 180);
$phone   = mb_substr($phone, 0, 40);
$message = mb_substr($message, 0, 4000);

$sourceUrl = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
$sourceUrl = filter_var($sourceUrl, FILTER_SANITIZE_URL) ?: '';

$notes = $message;
if ($extraLines) {
  $notes = ($notes !== '' ? $notes . "\n\n" : '') . implode("\n", $extraLines);
}
if ($formTag !== '') {
  $notes = ($notes !== '' ? $notes . "\n\n" : '') . 'Form: ' . $formTag;
}
if ($sourceUrl !== '') {
  $notes = ($notes !== '' ? $notes . "\n\n" : '') . 'Source URL: ' . $sourceUrl;
}

// Follow Up Boss Full Format — do not drop blank labels
$body = "New lead activity notification\n\n"
  . "Name: {$name}\n"
  . "Email: {$email}\n"
  . "Phone: {$phone}\n"
  . "Price:\n"
  . "Source: {$source}\n"
  . "Notes: {$notes}\n";

$subject = 'XI Website lead — ' . $tagLabel . ' — ' . $name;

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . sprintf('%s <%s>', $FROM_NAME, $FROM_EMAIL);
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: XI-lead-php';

$ok = @mail($FUB_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

if ($NOTIFY_COPY !== '') {
  $copySubject = 'XI ' . $tagLabel . ' copy — ' . $name;
  $copyBody = "Form copy\n\n"
    . "Form: {$formTag}\n"
    . "Name: {$name}\n"
    . "Email: {$email}\n"
    . "Phone: {$phone}\n"
    . "Message:\n{$message}\n";
  if ($extraLines) {
    $copyBody .= "\n" . implode("\n", $extraLines) . "\n";
  }
  @mail($NOTIFY_COPY, '=?UTF-8?B?' . base64_encode($copySubject) . '?=', $copyBody, implode("\r\n", $headers));
}

if (!$ok) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Could not send. Try emailing us directly.']);
  exit;
}

echo json_encode(['ok' => true]);
