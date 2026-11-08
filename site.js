/* Zenith ERP marketing site. No dependencies. */
(function () {
  'use strict';

  // Paste the access key from web3forms.com here (tied to info@zenitherps.com).
  // While it is empty, the call-back form opens WhatsApp with the details typed in.
  var WEB3FORMS_KEY = '5e8a32a5-9216-4c77-a4c2-551e53abeb08';
  var WHATSAPP_NUMBER = '918446297369';

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

  // Call-back form.
  var form = document.getElementById('callback');
  var button = form.querySelector('.form__submit');
  var error = document.getElementById('form-error');
  var fields = ['name', 'shop', 'phone', 'city'];

  function values() {
    var out = {};
    fields.forEach(function (n) { out[n] = form.elements[n].value.trim(); });
    return out;
  }

  function validate(v) {
    var ok = true;
    fields.forEach(function (n) {
      var bad = !v[n] || (n === 'phone' && v[n].replace(/\D/g, '').length < 10);
      form.elements[n].classList.toggle('is-invalid', bad);
      if (bad && ok) { form.elements[n].focus(); ok = false; }
    });
    return ok;
  }

  function sent() {
    button.textContent = 'Thank you, we will call you';
    button.disabled = true;
    error.hidden = true;
  }

  function viaWhatsApp(v) {
    var text = 'Call back request from ' + v.name + ', ' + v.shop + ', ' + v.phone + ', ' + v.city;
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    sent();
  }

  function viaWeb3Forms(v) {
    button.disabled = true;
    button.textContent = 'Sending…';
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: 'Call back request from ' + v.name + ' (' + v.shop + ')',
        from_name: 'zenitherps.com',
        name: v.name, shop: v.shop, phone: v.phone, city: v.city,
        botcheck: form.elements.botcheck.checked
      })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.success) { sent(); return; }
      throw new Error('web3forms');
    }).catch(function () {
      button.disabled = false;
      button.textContent = 'Request a Call Back';
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
})();
