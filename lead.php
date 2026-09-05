<?php
/**
 * XI Contact → Follow Up Boss lead parser
 * Drop this at the site root on GoDaddy (Linux / PHP hosting).
 * Contact form POSTs here; we email FUB in Full Format.
 *
 * Requires: PHP mail() enabled (standard on GoDaddy cPanel hosting).
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Methods: POST');
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
$FUB_TO      = 'shaun.moamem@followupboss.me';
$FROM_EMAIL  = 'info@xipremierproductions.com';
$FROM_NAME   = 'XI Premier Productions';
$SOURCE      = 'XI Website';
$NOTIFY_COPY = 'shaun@xipremierproductions.com'; // human inbox copy; set '' to disable

function field($key) {
  $v = isset($_POST[$key]) ? $_POST[$key] : '';
  if (is_array($v)) $v = '';
  $v = trim(strip_tags((string) $v));
  // keep newlines in message only
  return $v;
}

// Honeypot — bots fill "company"; humans never see it
if (field('company') !== '') {
  http_response_code(200);
  echo json_encode(['ok' => true]);
  exit;
}

$name    = field('name');
$email   = field('email');
$phone   = field('phone');
$message = isset($_POST['message']) ? trim((string) $_POST['message']) : '';
$message = str_replace(["\r\n", "\r"], "\n", strip_tags($message));

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
if ($sourceUrl !== '') {
  $notes = ($notes !== '' ? $notes . "\n\n" : '') . 'Source URL: ' . $sourceUrl;
}

// Follow Up Boss Full Format — do not drop blank labels
$body = "New lead activity notification\n\n"
  . "Name: {$name}\n"
  . "Email: {$email}\n"
  . "Phone: {$phone}\n"
  . "Price:\n"
  . "Source: {$SOURCE}\n"
  . "Notes: {$notes}\n";

$subject = 'XI Website lead — ' . $name;

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . sprintf('%s <%s>', $FROM_NAME, $FROM_EMAIL);
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: XI-lead-php';

$ok = @mail($FUB_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

if ($NOTIFY_COPY !== '') {
  $copySubject = 'XI contact copy — ' . $name;
  $copyBody = "Contact form copy (also sent to Follow Up Boss)\n\n"
    . "Name: {$name}\n"
    . "Email: {$email}\n"
    . "Phone: {$phone}\n"
    . "Message:\n{$message}\n";
  @mail($NOTIFY_COPY, '=?UTF-8?B?' . base64_encode($copySubject) . '?=', $copyBody, implode("\r\n", $headers));
}

if (!$ok) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Could not send. Try emailing us directly.']);
  exit;
}

echo json_encode(['ok' => true]);
