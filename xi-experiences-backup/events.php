<?php
/* Events page. Cards are rendered server-side from the inline $xi_events list below
   (no data/events.json). Markup comes from inc/xi-events.php (xi_render_night). */
declare(strict_types=1);
require __DIR__ . '/inc/xi-events.php';

$xi_events = [
    ['title' => 'XI Penthouse Sessions Halloween', 'date' => '2026-10-30', 'time' => '8:30PM - 12:45AM', 'location' => 'NYC - SoHo Loft Penthouse', 'description' => 'Halloween Costumes + live music + cocktails + exclusive penthouse access'],
    ['title' => 'XI All Hallows Eve by E11even x Cipriani', 'date' => '2026-10-31', 'time' => '10:00PM - 4:00AM', 'location' => 'NYC - Cipriani Wall Street', 'description' => 'Halloween at the iconic Cipriani Wall Street + DJ sets by MEDUZA & special guests + theatrical performances + elevated costume affair'],
    ['title' => 'XI Othership Spa Experience', 'date' => '2026-11-05', 'time' => '7:00PM', 'location' => 'NYC', 'description' => 'Sauna + ice bath + guided breathwork + social wellness experience'],
    ['title' => 'XI Holiday Party', 'date' => '2026-11-19', 'time' => '6:00PM - 9:00PM', 'location' => 'NYC - Niku', 'description' => 'Upscale holiday party + cocktails + exclusive rooftop views'],
    ['title' => 'New York Knicks Suite at Madison Square Garden', 'date' => '2026-11-21', 'time' => '7:30PM', 'location' => 'NYC - MSG', 'description' => 'New York Knicks vs. Portland Trail Blazers at Madison Square Garden + private suite'],
    ['title' => 'XI Casino Night in SoHo', 'date' => '2026-12-03', 'time' => '7:00PM - 11:00PM', 'location' => 'NYC - SoHo Loft', 'description' => 'Blackjack + poker + roulette + cocktails + exclusive SoHo loft'],
];

$upcoming = [];
foreach ($xi_events as $ev) {
    if (xi_is_past($ev)) { continue; }   // past dates drop off automatically
    $ev += ['image' => '', 'cta_url' => '', 'cta_label' => ''];
    $ev['month_label'] = xi_month_label($ev['date']);
    $ev['date_label']  = xi_date_label($ev);
    $upcoming[] = $ev;
}
$xi_words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
$n = count($upcoming);
$lede = $n === 0 ? 'New dates soon.'
    : (($xi_words[$n] ?? (string)$n) . ($n === 1 ? ' night' : ' nights') . ' in New York.');
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>XI Events — Season 2026 in New York, the Hamptons &amp; Miami</title>
  <meta name="description" content="XI evenings in New York, the Hamptons, and Miami. Season 2026 — dinners, house nights, destination retreats. Invitation only. Dates follow the room.">
  <link rel="canonical" href="https://www.xiexperiences.com/events.php">
  <meta property="og:title" content="XI Events — Season 2026 in New York, the Hamptons &amp; Miami">
  <meta property="og:description" content="XI evenings in New York, the Hamptons, and Miami. Season 2026 — dinners, house nights, destination retreats. Invitation only. Dates follow the room.">
  <meta property="og:url" content="https://www.xiexperiences.com/events.php">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://dattax.github.io/assets/hero-still.jpg">
  <meta property="og:image:alt" content="XI Experiences">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="assets/favicon.png" type="image/png">
  <meta name="theme-color" content="#070a0a">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Jost:wght@200;300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/site.css?v=xi-logo-1">
</head>
<body class="page-events">
  <a class="skip" href="#main">Skip to the evenings</a>
  <header class="site-header">
    <a class="mark" href="index.html"><img src="assets/logo-hero.svg" width="86" height="64" alt="XI"></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav" aria-label="Open menu"><span></span></button>
    <nav class="site-nav" id="nav">
      <a href="about.html">About</a>
      <a href="events.php" class="is-here">Events</a>
      <a href="services.html">Services</a>
      <a href="sponsorship.html">Sponsorship</a>
      <a class="cta" href="contact.html">Contact</a>
      <a class="cta cta-members" href="https://ximembersclub.com/">Members</a>
    </nav>
  </header>

  <main id="main">
    <header class="page-head">
      <p class="eyebrow">Upcoming</p>
      <h1 class="display">Season<br><em>2026.</em></h1>
      <p class="lede"><?= xi_e($lede) ?></p>
    </header>

    <section class="section nights" aria-label="<?= xi_e(rtrim($lede, '.')) ?>">
<?php if (!$upcoming): ?>
      <article class="night">
        <p class="eyebrow">Season 2026</p>
        <h3>New dates soon.</h3>
        <p class="blurb">The next rooms are being set. <a href="contact.html">Ask to be on the list.</a></p>
      </article>
<?php else: foreach ($upcoming as $ev) { echo xi_render_night($ev); } endif; ?>
    </section>

    <section class="section" style="padding-bottom:1rem" hidden>
      <p class="eyebrow">The rooms</p>
      <h2 class="display">Upcoming<br><em>Events.</em></h2>
    </section>

    <section class="room-band nyc" id="nyc" hidden>
      <img src="assets/room-nyc.jpg" alt="New York" width="1200" height="1800">
      <p class="eyebrow">Room I</p>
      <h2 class="display">New York</h2>
      <p class="lede">High floor, low light. Dinners that start after the close.</p>
    </section>

    <section class="section" hidden>
      <div class="card-grid">
        <article class="named-card">
          <p class="meta">Dinner · Season 2026</p>
          <div>
            <h3>The Ledger Supper</h3>
            <p>A long table after the tape.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">Rooftop · Season 2026</p>
          <div>
            <h3>High Floor, Low Light</h3>
            <p>City evening. Wind off the water.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">City · Season 2026</p>
          <div>
            <h3>After Hours at the River</h3>
            <p>A downtown night with no printed start time.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">Talk · Season 2026</p>
          <div>
            <h3>Winter Correspondence</h3>
            <p>One question, a fire, no stage. Coming season.</p>
          </div>
        </article>
      </div>
    </section>

    <section class="room-band hamptons" id="hamptons" hidden>
      <img src="assets/room-hamptons.jpg" alt="The Hamptons" width="1200" height="1800">
      <p class="eyebrow">Room II</p>
      <h2 class="display">The Hamptons</h2>
      <p class="lede">Harbor, dune, cedar. The action lasts all year.</p>
    </section>

    <section class="section" hidden>
      <div class="card-grid">
        <article class="named-card">
          <p class="meta">Supper · Season 2026</p>
          <div>
            <h3>The Harbor Table</h3>
            <p>Water at the window. A Saturday supper.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">XI Premier · Season 2026</p>
          <div>
            <h3>Salt &amp; Cedar</h3>
            <p>A house evening. Windows open to the marsh.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">Dune · Season 2026</p>
          <div>
            <h3>Dune Evening</h3>
            <p>Light going early. The kind of night you do not photograph.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">Harbor · Season 2026</p>
          <div>
            <h3>Sunday Water</h3>
            <p>A harbor morning that becomes an afternoon. Coming season.</p>
          </div>
        </article>
      </div>
    </section>


    <section class="room-band miami" id="miami" hidden>
      <img src="assets/room-miami.jpg" alt="Miami" width="1200" height="1800">
      <p class="eyebrow">Room III</p>
      <h2 class="display">Miami</h2>
      <p class="lede">Warm night, open water. Dinners that start after the heat.</p>
    </section>

    <section class="section" hidden>
      <div class="card-grid">
        <article class="named-card">
          <p class="meta">Dinner · Season 2026</p>
          <div>
            <h3>The Bay Table</h3>
            <p>Water at the window. A late supper.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">XI Premier · Season 2026</p>
          <div>
            <h3>Warm Night</h3>
            <p>Windows open. The air does the rest.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">City · Season 2026</p>
          <div>
            <h3>After the Heat</h3>
            <p>Downtown. No printed start time.</p>
          </div>
        </article>
        <article class="named-card">
          <p class="meta">Talk · Season 2026</p>
          <div>
            <h3>Correspondence, South</h3>
            <p>One question. Coming season.</p>
          </div>
        </article>
      </div>
    </section>


    <section class="section retreats-section" hidden>
      <p class="eyebrow">Retreats</p>
      <h2 class="display">When the house<br><em>is full of aces.</em></h2>
      <div class="table">
        <div class="envelope" aria-hidden="true">
          <svg viewBox="0 0 400 250" fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="18" y="78" width="364" height="154"/>
            <path d="M18 78 L200 18 L382 78"/>
            <path d="M18 78 L200 168 L382 78"/>
          </svg>
        </div>

        <div class="deck" id="deck">
          <article class="pass" tabindex="0" role="button" aria-pressed="false">
            <div class="pass-head"><span>Invitation</span><span class="no">XI — 01</span></div>
            <figure class="photo">
              <img src="assets/retreat-room-right.jpg" alt="A night cafe behind glass, the room reflected in water." width="576" height="864">
            </figure>
            <div class="copy">
              <h2>When the room is right</h2>
              <p>Dates follow the room.</p>
            </div>
            <div class="stub">
              <p class="meta">Destination · Dates follow the room</p>
              <span class="stamp" aria-hidden="true">XI</span>
            </div>
          </article>

          <article class="pass" tabindex="0" role="button" aria-pressed="false">
            <div class="pass-head"><span>Invitation</span><span class="no">XI — 02</span></div>
            <figure class="photo">
              <img src="assets/retreat-leaves-map.jpg" alt="A night crowd under blue stage light." width="576" height="864">
            </figure>
            <div class="copy">
              <h2>The house leaves the map</h2>
              <p>A few nights. No public list.</p>
            </div>
            <div class="stub">
              <p class="meta">Destination · Dates follow the room</p>
              <span class="stamp" aria-hidden="true">XI</span>
            </div>
          </article>

          <article class="pass" tabindex="0" role="button" aria-pressed="false">
            <div class="pass-head"><span>Invitation</span><span class="no">XI — 03</span></div>
            <figure class="photo">
              <img src="assets/retreat-off-map.jpg" alt="A white Rolls-Royce at night, off the map." width="576" height="864">
            </figure>
            <div class="copy">
              <h2>Off the map</h2>
              <p>When the room is right, we go.</p>
            </div>
            <div class="stub">
              <p class="meta">Destination · Dates follow the room</p>
              <span class="stamp" aria-hidden="true">XI</span>
            </div>
          </article>

          <article class="pass" tabindex="0" role="button" aria-pressed="false">
            <div class="pass-head"><span>Invitation</span><span class="no">XI — 04</span></div>
            <figure class="photo">
              <img src="assets/retreat-hour-gold.jpg" alt="Golden hour through a tent, a crowd and a lit marquee." width="900" height="1350">
            </figure>
            <div class="copy">
              <h2>While the light holds</h2>
              <p>The tent is the door.</p>
            </div>
            <div class="stub">
              <p class="meta">Destination · Dates follow the room</p>
              <span class="stamp" aria-hidden="true">XI</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section section-center" id="curate">
      <div class="event-actions">
        <button class="sponsor-open" type="button" data-modal="event-modal">
          <span class="eyebrow">We love this game</span>
          <span class="display">Need help<br><em>curating an event?</em></span>
          <span class="hint">Open the form</span>
        </button>
      </div>
    </section>
  </main>

  <div class="modal" id="event-modal" hidden>
    <div class="modal-backdrop" data-close tabindex="-1"></div>
    <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <button class="modal-close" type="button" data-close aria-label="Close">Close</button>
      <p class="eyebrow">The list</p>
      <h2 id="event-modal-title" class="display">Need help<br><em>curating an event?</em></h2>
      <form class="form" id="event-form" action="mailto:events@xiexperiences.com" method="post" enctype="text/plain" data-subject="XI event questionnaire">
        <input type="hidden" name="form_tag" value="xi-event">
        <div class="field">
          <label for="ev-name">Event Name</label>
          <input id="ev-name" name="event-name" type="text" required>
        </div>
        <div class="field">
          <label for="ev-host">Event Host</label>
          <input id="ev-host" name="event-host" type="text" required>
        </div>
        <div class="field">
          <label for="ev-poc">Point of Contact (Name, Phone Number, Email)</label>
          <textarea id="ev-poc" name="point-of-contact" rows="3"></textarea>
        </div>
        <div class="field">
          <label for="ev-date">Event Date</label>
          <input id="ev-date" name="event-date" type="text">
        </div>
        <div class="field">
          <label for="ev-time">Event Start &amp; End Time</label>
          <input id="ev-time" name="event-time" type="text">
        </div>
        <div class="field">
          <label for="ev-address">Event Address</label>
          <input id="ev-address" name="event-address" type="text">
        </div>
        <div class="field">
          <label for="ev-headcount">Estimated Headcount</label>
          <input id="ev-headcount" name="headcount" type="text">
        </div>
        <div class="field">
          <label for="ev-staff">Staffing Needs (Bartenders, Servers, Bussers, Etc.)</label>
          <textarea id="ev-staff" name="staff" rows="3"></textarea>
        </div>
        <div class="field">
          <label for="ev-video">Videography Needed? Drone Footage Needed?</label>
          <textarea id="ev-video" name="videography-drone" rows="3"></textarea>
        </div>
        <div class="field">
          <label for="ev-music">Music Needs (DJ, Musicians, Bluetooth Speakers, Etc.)</label>
          <textarea id="ev-music" name="music" rows="3"></textarea>
        </div>
        <div class="field">
          <label for="ev-drinks">Drinks (Type)</label>
          <input id="ev-drinks" name="drinks" type="text">
        </div>
        <div class="field">
          <label for="ev-catering">Catering (Type)</label>
          <input id="ev-catering" name="catering" type="text">
        </div>
        <div class="form-actions">
          <button class="cta" type="submit">Send</button>
          <p class="form-note" role="status">We’ll write back.</p>
        </div>
        <p class="mail-fallback">Or write directly: <a href="mailto:events@xiexperiences.com">events@xiexperiences.com</a></p>
      </form>
    </div>
  </div>


  <footer class="site-footer">
    <a class="mark" href="index.html"><img src="assets/logo-hero.svg" width="86" height="64" alt="XI"></a>
    <div class="foot-row">
      <div>
        <p class="places">New York · Hamptons · Miami</p>
        <p>Private events and experiences. Invitation only.</p>
      </div>
      <p><a href="contact.html">Contact</a></p>
    </div>
  </footer>
  <script src="js/site.js?v=xi-forms-1"></script>
</body>
</html>
