/* Zenith ERP marketing site. No dependencies. */
(function () {
  'use strict';

  // Paste the access key from web3forms.com here (tied to info@zenitherps.com).
  // While it is empty, the call-back form opens WhatsApp with the details typed in.
  var WEB3FORMS_KEY = '5e8a32a5-9216-4c77-a4c2-551e53abeb08';
  var WHATSAPP_NUMBER = '918446297369';

  // Analytics and error reports live in common.js. The forms must work without it.
  var zenith = window.zenith || { track: function () {}, report: function () {} };
  var track = zenith.track;

  // Scroll depth: one event per section the first time it comes into view.
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        track('section_view', { section: en.target.id });
        seen.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('section[id]').forEach(function (s) { seen.observe(s); });
  }

  // Header: border + shadow once the page has scrolled more than 8px.
  var nav = document.getElementById('nav');
  var scrolled = false;
  function onScroll() {
    var sc = window.scrollY > 8;
    if (sc !== scrolled) { scrolled = sc; nav.classList.toggle('is-scrolled', sc); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Scroll reveals: only needed where CSS scroll-driven animations are unsupported.
  if (!CSS.supports('animation-timeline: view()')) {
    var items = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      items.forEach(function (el) { io.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  // Forms. Both post to Web3Forms when the key is set, otherwise open WhatsApp with the details.
  // opts: { form, fields, subject(v), whatsappText(v), label, idle, onSent(v) }
  function wireForm(opts) {
    var form = opts.form;
    if (!form) return;
    var button = form.querySelector('.form__submit');
    var error = form.querySelector('.form__error');
    var fields = opts.fields;

    function values() {
      var out = {};
      fields.forEach(function (n) { out[n] = form.elements[n].value.trim(); });
      return out;
    }

    function validate(v) {
      var ok = true;
      fields.forEach(function (n) {
        var bad = !v[n];
        if (!bad && n === 'phone') bad = v[n].replace(/\D/g, '').length < 10;
        if (!bad && n === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v[n]);
        form.elements[n].classList.toggle('is-invalid', bad);
        if (bad && ok) { form.elements[n].focus(); ok = false; }
      });
      return ok;
    }

    function sent(how, v) {
      track(opts.label + '_sent', { method: how });
      button.textContent = opts.done;
      button.disabled = true;
      error.hidden = true;
      if (opts.onSent) opts.onSent(v);
    }

    function viaWhatsApp(v) {
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(opts.whatsappText(v)), '_blank', 'noopener');
      sent('whatsapp', v);
    }

    function viaWeb3Forms(v) {
      button.disabled = true;
      button.textContent = 'Sending…';
      var body = { access_key: WEB3FORMS_KEY, subject: opts.subject(v), from_name: 'zenitherps.com', botcheck: form.elements.botcheck.checked };
      fields.forEach(function (n) { body[n] = v[n]; });
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.success) { sent('email', v); return; }
        throw new Error('web3forms');
      }).catch(function () {
        track(opts.label + '_error', {});
        zenith.report(opts.label + '-form-failed');
        button.disabled = false;
        button.textContent = opts.idle;
        error.hidden = false;
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.botcheck.checked) return;
      var v = values();
      if (!validate(v)) return;
      if (WEB3FORMS_KEY) viaWeb3Forms(v); else viaWhatsApp(v);
    });
  }

  // Call-back form.
  wireForm({
    form: document.getElementById('callback'),
    fields: ['name', 'shop', 'phone', 'city'],
    label: 'callback',
    idle: 'Request a Call Back',
    done: 'Thank you, we will call you',
    subject: function (v) { return 'Call back request from ' + v.name + ' (' + v.shop + ')'; },
    whatsappText: function (v) { return 'Call back request from ' + v.name + ', ' + v.shop + ', ' + v.phone + ', ' + v.city; }
  });

  // Free download (lead magnet): the gold billing calculator. The file is served from this
  // site, so once the lead has been recorded we start the download and show a fallback link.
  var CALCULATOR_FILE = 'assets/zenith-gold-billing-calculator.xlsx';
  wireForm({
    form: document.getElementById('leadmagnet'),
    fields: ['name', 'phone', 'email'],
    label: 'calculator',
    idle: 'Download Free Calculator',
    done: 'Sent, downloading now',
    subject: function (v) { return 'Calculator download from ' + v.name + ' (' + v.phone + ')'; },
    whatsappText: function (v) { return 'Please send me the gold billing calculator. ' + v.name + ', ' + v.phone + ', ' + v.email; },
    onSent: function () {
      var done = document.getElementById('lead-done');
      done.hidden = false;
      var a = document.createElement('a');
      a.href = CALCULATOR_FILE;
      a.download = 'Zenith-Gold-Billing-Calculator.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  });
})();
