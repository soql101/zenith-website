/*
 * Buy page: pick a plan, pay with PayPal, get the licence key on screen (and by email).
 * The licence server sets every price; this page only shows them.
 */
(function () {
  'use strict';

  var cfg = window.ZCX_BUY_CONFIG || {};
  var productId = document.body.getAttribute('data-product');
  var api = String(cfg.licenceApi || '').replace(/\/+$/, '');
  var $ = function (id) { return document.getElementById(id); };

  // Analytics and error reports live in common.js. Buying must work without it.
  var zenith = window.zenith || { track: function () {}, report: function () {} };

  var state = { plan: null, product: null };

  // What is being bought, the way GA4 wants it. Never the key or the buyer's email.
  function cart(plan) {
    var p = state.product.plans.filter(function (x) { return x.plan === plan; })[0];
    var price = p ? Number(p.usd) : 0;
    return { currency: 'USD', value: price, items: [{ item_id: productId, item_name: state.product.name, item_variant: plan, price: price, quantity: 1 }] };
  }

  function failed(step, error) {
    zenith.track('buy_error', { product: productId, step: step });
    zenith.report('buy-' + step, error);
  }

  function show(id, on) { $(id).hidden = !on; }

  function showError(msg) {
    $('buy-error').textContent = msg;
    show('buy-error', !!msg);
  }

  function notReady() {
    show('buy-loading', false);
    show('buy-offline', true);
  }

  if (!productId || !api || /^PASTE_/.test(api) || /^PASTE_/.test(String(cfg.paypalClientId || ''))) {
    notReady();
    return;
  }

  function post(path, body) {
    return fetch(api + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { status: res.status, ok: res.ok, data: data };
      });
    });
  }

  function money(usd) { return 'USD ' + usd; }

  function renderPlans(product) {
    var list = $('buy-plans');
    list.textContent = '';
    product.plans.forEach(function (p, i) {
      var label = document.createElement('label');
      label.className = 'plan';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'plan';
      input.value = p.plan;
      input.checked = i === product.plans.length - 1; // lifetime is listed last: the default
      if (input.checked) state.plan = p.plan;
      input.addEventListener('change', function () { state.plan = p.plan; });
      var text = document.createElement('span');
      text.className = 'plan__text';
      text.textContent = p.label;
      var price = document.createElement('span');
      price.className = 'plan__price';
      price.textContent = money(p.usd);
      label.appendChild(input);
      label.appendChild(text);
      label.appendChild(price);
      list.appendChild(label);
    });
    if (product.plans.length === 1) list.classList.add('plans--single');
  }

  function showLicence(d) {
    show('buy-form', false);
    show('buy-pending', false);
    $('done-key').textContent = d.key;
    $('done-validity').textContent = d.validUntil
      ? 'Valid until ' + new Date(d.validUntil).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) + '.'
      : 'Lifetime licence.';
    $('done-email').textContent = d.emailed && d.email
      ? 'We also emailed it to ' + d.email + '.'
      : 'Copy it now and keep it safe. If you lose it, email info@zenitherps.com with your PayPal receipt.';
    show('buy-done', true);
    var sale = cart(d.plan);
    sale.transaction_id = d.orderId;
    zenith.track('purchase', sale);
    $('buy-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  $('done-copy').addEventListener('click', function () {
    var key = $('done-key').textContent;
    var btn = $('done-copy');
    zenith.track('key_copied', { product: productId });
    (navigator.clipboard ? navigator.clipboard.writeText(key) : Promise.reject()).then(function () {
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = 'Copy key'; }, 1800);
    }, function () {
      var range = document.createRange();
      range.selectNodeContents($('done-key'));
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  });

  function loadPayPal(sandbox) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      // buyer-country is a sandbox-only test setting: checkout behaves as for a US buyer, so a test
      // never trips PayPal's block on payments between two Indian accounts. Never sent when live.
      s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(cfg.paypalClientId) +
        '&currency=USD&intent=capture&components=buttons' + (sandbox ? '&buyer-country=US' : '');
      s.onload = function () { resolve(window.paypal); };
      s.onerror = function () { reject(new Error('PayPal did not load')); };
      document.head.appendChild(s);
    });
  }

  function renderButtons(paypal) {
    return paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 48 },
      createOrder: function () {
        showError('');
        return post('/api/orders', { productId: productId, plan: state.plan }).then(function (r) {
          if (!r.ok || !r.data.id) {
            var e = new Error(r.data.error || 'Could not start the payment.');
            e.reported = true;
            failed('order', 'HTTP ' + r.status);
            throw e;
          }
          zenith.track('begin_checkout', cart(state.plan));
          return r.data.id;
        });
      },
      onApprove: function (data, actions) {
        show('buy-working', true);
        return post('/api/orders/' + encodeURIComponent(data.orderID) + '/capture').then(function (r) {
          show('buy-working', false);
          if (r.status === 402 && r.data.restart) {
            zenith.track('buy_declined', { product: productId });
            return actions.restart();
          }
          if (r.status === 202) {
            zenith.track('buy_pending', { product: productId });
            show('buy-form', false);
            $('pending-email').textContent = r.data.email || 'your PayPal email';
            show('buy-pending', true);
            return;
          }
          if (!r.ok || !r.data.key) {
            failed('capture', 'HTTP ' + r.status);
            showError(r.data.error || 'Something went wrong. If money was taken, email info@zenitherps.com with your PayPal receipt.');
            return;
          }
          r.data.orderId = data.orderID;
          showLicence(r.data);
        }, function (err) {
          failed('capture-unreachable', err);
          show('buy-working', false);
          showError('We could not reach our server. If PayPal took the money, your key will be emailed to you. Or email info@zenitherps.com.');
        });
      },
      onCancel: function () {
        zenith.track('buy_cancel', { product: productId });
        showError('');
      },
      onError: function (err) {
        if (!err || !err.reported) failed('paypal', err);
        show('buy-working', false);
        showError((err && err.message) || 'PayPal had a problem. No money was taken. Please try again.');
      }
    }).render('#paypal-buttons');
  }

  fetch(api + '/api/products')
    .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(function (data) {
      var product = (data.products || []).filter(function (p) { return p.id === productId; })[0];
      if (!product) throw new Error('product not sold');
      state.product = product;
      var sandbox = data.environment !== 'production';
      if (sandbox) show('buy-sandbox', true);
      renderPlans(product);
      show('buy-loading', false);
      show('buy-form', true);
      zenith.track('view_item', cart(state.plan));
      return loadPayPal(sandbox).then(renderButtons);
    })
    .catch(function (err) {
      failed('load', err);
      show('buy-form', false);
      notReady();
    });
})();
