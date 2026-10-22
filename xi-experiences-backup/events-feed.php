<?php
/**
 * Public, read-only feed of PUBLISHED events, sorted by date (oldest first).
 *   events-feed.php              all published events (each has "is_past")
 *   events-feed.php?upcoming=1   only today and later (America/New_York)
 */
declare(strict_types=1);
require __DIR__ . '/inc/xi-events.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=300');

try {
    $events = xi_public_events(!empty($_GET['upcoming']));
    echo json_encode(['events' => $events], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
} catch (Throwable $e) {
    http_response_code(500);
    echo '{"events":[],"error":"unavailable"}';
}
