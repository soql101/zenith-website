/*
 * Loaded on every page: cookie choice, Google Analytics, error reports. No dependencies.
 *
 *   window.zenith.track(name, params)   a GA4 event; does nothing until the visitor accepts cookies
 *   window.zenith.report(name, error)   an error report to Sentry; no cookies, always on
 *
 * Never pass an email address, phone number, licence key or form value to either.
 */
(function () {
  'use strict';

  // While one of these is empty, that service is off.
  var GA_MEASUREMENT_ID = 'G-D7N3P8TSD8';
  var SENTRY_DSN = ''; // PLACEHOLDER: the website project's DSN from Sentry (public, safe to commit).

  // Only the real site counts; a local copy never sends anything.
  var LIVE = /^(www\.)?zenitherps\.com$/.test(location.hostname);
  var CHOICE_KEY = 'zenith_cookies'; // 'yes' or 'no', kept in this browser only

  /* Google Analytics, only after "Accept" */

  var gaOn = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function track(name, params) {
    if (gaOn) gtag('event', name, params || {});
  }

  function startAnalytics() {
    if (gaOn || !LIVE || !GA_MEASUREMENT_ID) return;
    gaOn = true;
    if (window['ga-disable-' + GA_MEASUREMENT_ID]) { // accepted again after a "no" on this page
      window['ga-disable-' + GA_MEASUREMENT_ID] = false;
      return;
    }
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);
    gtag('js', new Date());
    // No advertising features.
    gtag('config', GA_MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  }

  function stopAnalytics() {
    if (gaOn) window['ga-disable-' + GA_MEASUREMENT_ID] = true;
    gaOn = false;
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^_ga(_|$)/.test(name)) return;
      ['', '; domain=' + location.hostname, '; domain=.' + location.hostname.replace(/^www\./, '')].forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  /* Cookie choice */

  function readChoice() {
    try { return localStorage.getItem(CHOICE_KEY); } catch (e) { return null; }
  }

  function choose(choice) {
    try { localStorage.setItem(CHOICE_KEY, choice); } catch (e) { /* private window: asked again next page */ }
    if (choice === 'yes') startAnalytics(); else stopAnalytics();
    var bar = document.getElementById('cookies');
    if (bar) bar.remove();
  }

  function button(text, choice) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cookies__btn';
    b.textContent = text;
    b.addEventListener('click', function () { choose(choice); });
    return b;
  }

  function showBanner() {
    if (document.getElementById('cookies')) return;
    var bar = document.createElement('section');
    bar.className = 'cookies';
    bar.id = 'cookies';
    bar.setAttribute('aria-label', 'Cookie choice');
    var p = document.createElement('p');
    p.append('May we use Google Analytics cookies to count visits and improve this site? No ads. ');
    var a = document.createElement('a');
    a.href = '/privacy/';
    a.textContent = 'Privacy';
    p.appendChild(a);
    var row = document.createElement('div');
    row.className = 'cookies__row';
    row.appendChild(button('Decline', 'no'));
    row.appendChild(button('Accept', 'yes'));
    bar.appendChild(p);
    bar.appendChild(row);
    document.body.appendChild(bar);
    return bar;
  }

  if (GA_MEASUREMENT_ID) {
    var choice = readChoice();
    if (choice === 'yes') startAnalytics();
    else if (choice !== 'no') showBanner();

    var foot = document.querySelector('.foot__copy');
    if (foot) {
      var again = document.createElement('button');
      again.type = 'button';
      again.className = 'foot__cookies';
      again.textContent = 'Cookie settings';
      again.addEventListener('click', function () {
        var bar = showBanner();
        if (bar) bar.querySelector('button').focus();
      });
      foot.append(' · ', again);
    }
  }

  /* Clicks that matter, on every page */

  // Where on the page a button lives: the id of the nearest section, header or footer.
  function placeOf(el) {
    var host = el.closest('section[id], header[id], footer, .mobile-bar');
    if (!host) return 'page';
    return host.id || (host.classList.contains('mobile-bar') ? 'mobile_bar' : 'footer');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var buy = /^\/buy\/([a-z-]+)\//.exec(href);
    if (href.indexOf('tel:') === 0) track('call_click', { place: placeOf(a) });
    else if (href.indexOf('https://wa.me/') === 0) track('whatsapp_click', { place: placeOf(a) });
    else if (href.indexOf('mailto:') === 0) track('email_click', { place: placeOf(a) });
    else if (/^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)\//.test(href)) track('store_click', { place: placeOf(a) });
    else if (buy) track('buy_page_click', { place: placeOf(a), product: buy[1] });
  });

  /* Error reports to Sentry. No cookies, no IP address, at most 5 per page. */
  // Envelope format: https://develop.sentry.dev/sdk/foundations/envelopes/

  var reportsLeft = 5;

  function scrub(text) {
    return String(text).replace(/[^\s"'<>:]+@[^\s"'<>]+/g, '[email]').replace(/ZCX(?:-[A-Z0-9]{4}){3}/gi, '[key]').slice(0, 500);
  }

  function eventId() {
    var b = crypto.getRandomValues(new Uint8Array(16));
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }

  // Chrome and Safari / Firefox stack lines as Sentry frames, oldest call first.
  function frames(stack) {
    return String(stack || '').split('\n').map(function (line) {
      var m = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line) || /^(.*?)@(.+?):(\d+):(\d+)$/.exec(line);
      return m && { function: m[1] || '?', filename: m[2].split(/[?#]/)[0], lineno: Number(m[3]), colno: Number(m[4]), in_app: true };
    }).filter(Boolean).reverse();
  }

  function report(name, error) {
    if (!LIVE || !SENTRY_DSN || reportsLeft <= 0) return;
    reportsLeft -= 1;
    try {
      var dsn = new URL(SENTRY_DSN);
      var err = error instanceof Error ? error : null;
      var id = eventId();
      var event = {
        event_id: id,
        timestamp: Date.now() / 1000,
        platform: 'javascript',
        level: 'error',
        logger: 'website',
        environment: 'production',
        sdk: { name: 'zenith.website', version: '1.0.0', settings: { infer_ip: 'never' } },
        tags: { problem: name },
        // The path only: no query string and no #part.
        request: { url: location.origin + location.pathname, headers: { 'User-Agent': navigator.userAgent } },
        fingerprint: err ? ['{{ default }}', name] : [name]
      };
      if (err) event.exception = { values: [{ type: name + ': ' + err.name, value: scrub(err.message), stacktrace: { frames: frames(err.stack) } }] };
      else event.message = name + (error ? ': ' + scrub(error) : '');
      // Plain text and the key in the address: no extra preflight request.
      fetch(dsn.origin + '/api' + dsn.pathname + '/envelope/?sentry_version=7&sentry_key=' + encodeURIComponent(dsn.username), {
        method: 'POST',
        headers: { 'content-type': 'text/plain;charset=UTF-8' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        keepalive: true,
        body: JSON.stringify({ event_id: id, sent_at: new Date().toISOString() }) + '\n{"type":"event"}\n' + JSON.stringify(event)
      }).catch(function () {});
    } catch (e) { /* reporting a problem must not cause another one */ }
  }

  // Only errors from our own files: visitors' browser extensions and PayPal's script are not ours.
  function isOurs(text) { return String(text || '').indexOf(location.origin + '/') !== -1; }

  window.addEventListener('error', function (e) {
    if (isOurs(e.filename)) report('page-error', e.error || e.message);
  });
  window.addEventListener('unhandledrejection', function (e) {
    if (e.reason instanceof Error && isOurs(e.reason.stack)) report('page-error', e.reason);
  });

  window.zenith = { track: track, report: report };
})();
