<?php
// XI events admin config (example). Copy to config.php and fill in.
// Generate hash: php -r 'echo password_hash("YOUR_PASSWORD", PASSWORD_DEFAULT), PHP_EOL;'
// An empty password_hash disables login.
return [
    'admin_email'     => 'admin@example.com',
    'password_hash'   => '',   // paste $2y$... bcrypt hash here
    'max_attempts'    => 5,
    'lockout_minutes' => 15,
    'idle_minutes'    => 120,
];
