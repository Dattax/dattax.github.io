/*
 * Datta Consulting Group: Google Analytics 4 (single shared switch)
 * ---------------------------------------------------------------
 * Every page loads this one file. To turn tracking on for the whole site,
 * replace the placeholder below with the real GA4 Measurement ID (G-XXXXXXXXXX).
 * Until then nothing is loaded and no data is sent.
 */
window.DCG_GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';   // <-- swap me

(function () {
  var id = window.DCG_GA_MEASUREMENT_ID;
  if (!/^G-[A-Z0-9]{6,}$/.test(id) || id === 'G-XXXXXXXXXX') { return; }   // placeholder: stay inert
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
})();
