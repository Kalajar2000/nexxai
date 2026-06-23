/* NEXXAI cookie consent - GDPR / ePrivacy friendly.
   Loads NO tracking until the visitor consents. Self-contained: injects its
   own styles + banner + preferences modal. Re-open via any element with
   [data-cookie-settings].

   >>> TO ADD APOLLO (or GA, Meta, etc.): paste the snippet inside
       loadAnalytics() below. It only runs after analytics consent. <<<
*/
(function () {
  var KEY = 'nexxai_consent_v1';
  function getConsent() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function saveConsent(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }

  // ---- where tracking actually loads (only after consent) ----
  function loadAnalytics() {
    if (window.__nxAnalyticsLoaded) return;
    window.__nxAnalyticsLoaded = true;
    // Google Analytics 4 (loads only after analytics consent)
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', 'G-399RKZXX8Z');
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-399RKZXX8Z';
    document.head.appendChild(ga);
    // Apollo website visitor tracking (loads only after analytics consent)
    var n = Math.random().toString(36).substring(7);
    var o = document.createElement('script');
    o.src = 'https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=' + n;
    o.async = true; o.defer = true;
    o.onload = function () { if (window.trackingFunctions && window.trackingFunctions.onLoad) window.trackingFunctions.onLoad({ appId: '6a311c8e6824f3001c0fa90c' }); };
    document.head.appendChild(o);
  }

  // ---- styles ----
  var css = '\
.ckb{position:fixed;left:16px;right:16px;bottom:16px;z-index:400;max-width:880px;margin:0 auto;border-radius:18px;background:rgba(13,15,30,.92);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 60px rgba(0,0,0,.5);transform:translateY(140%);transition:transform .45s cubic-bezier(.16,1,.3,1)}\
.ckb.show{transform:none}\
.ckb-in{display:flex;align-items:center;gap:20px;padding:18px 22px;flex-wrap:wrap}\
.ckb-txt{flex:1;min-width:240px;color:#c9cbe0;font:400 .9rem/1.55 Inter,system-ui,sans-serif}\
.ckb-txt strong{color:#fff}\
.ckb-txt a{color:#a78bfa;text-decoration:underline}\
.ckb-btns{display:flex;gap:10px;flex-wrap:wrap}\
.ckb-btn{font:600 .86rem Inter,system-ui,sans-serif;padding:11px 18px;border-radius:999px;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#e7e8f4;transition:.2s;white-space:nowrap}\
.ckb-btn:hover{background:rgba(255,255,255,.1)}\
.ckb-btn.solid{border-color:transparent;color:#fff;background:linear-gradient(135deg,#8b5cf6,#3b82f6);box-shadow:0 8px 22px rgba(124,58,237,.4)}\
.ckm{position:fixed;inset:0;z-index:401;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(5,5,10,.7);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}\
.ckm.show{display:flex}\
.ckm-box{width:100%;max-width:520px;border-radius:20px;background:rgba(16,18,32,.98);border:1px solid rgba(255,255,255,.12);padding:30px;box-shadow:0 30px 80px rgba(0,0,0,.6)}\
.ckm-box h3{font:600 1.3rem Poppins,sans-serif;color:#fff;margin:0 0 8px}\
.ckm-box>p{color:#9a9cbb;font:400 .9rem/1.6 Inter,sans-serif;margin:0 0 18px}\
.ckm-row{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;padding:15px 0;border-top:1px solid rgba(255,255,255,.08)}\
.ckm-row span{color:#c9cbe0;font:400 .86rem/1.5 Inter,sans-serif}\
.ckm-row span strong{color:#fff;font-weight:600;font-size:.95rem}\
.ckm-row input{width:18px;height:18px;accent-color:#8b5cf6;margin-top:3px;flex-shrink:0}\
.ckm-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:22px;flex-wrap:wrap}\
@media(max-width:560px){.ckb-in{padding:16px}.ckb-btn{flex:1}}';

  var BANNER = '<div class="ckb" role="dialog" aria-label="Cookie consent"><div class="ckb-in">\
<div class="ckb-txt"><strong>We use cookies.</strong> Essential cookies keep the site running. We also use analytics and marketing cookies (for example Apollo) to understand traffic and identify interested companies. You can reject these or set preferences anytime. Read our <a href="/privacy/">Privacy &amp; Cookie Policy</a>.</div>\
<div class="ckb-btns">\
<button class="ckb-btn" data-ck="reject">Reject non-essential</button>\
<button class="ckb-btn" data-ck="prefs">Preferences</button>\
<button class="ckb-btn solid" data-ck="accept">Accept all</button>\
</div></div></div>';

  var MODAL = '<div class="ckm" role="dialog" aria-modal="true" aria-label="Cookie preferences"><div class="ckm-box">\
<h3>Cookie preferences</h3>\
<p>Choose which cookies we can use. You can change this anytime from the footer.</p>\
<label class="ckm-row"><span><strong>Strictly necessary</strong><br>Required for the site to work. Always on.</span><input type="checkbox" checked disabled></label>\
<label class="ckm-row"><span><strong>Analytics &amp; marketing</strong><br>Traffic insights and visitor identification (for example Apollo). Uses cookies and may share your IP address with third parties.</span><input type="checkbox" id="ckAnalytics"></label>\
<div class="ckm-btns"><button class="ckb-btn" data-ck="save">Save choices</button><button class="ckb-btn solid" data-ck="accept">Accept all</button></div>\
</div></div>';

  function init() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var wrap = document.createElement('div'); wrap.innerHTML = BANNER + MODAL; document.body.appendChild(wrap);
    var banner = wrap.querySelector('.ckb'), modal = wrap.querySelector('.ckm'), aBox = wrap.querySelector('#ckAnalytics');

    function showBanner() { setTimeout(function () { banner.classList.add('show'); }, 600); }
    function hideBanner() { banner.classList.remove('show'); }
    function openModal() { aBox.checked = !!(getConsent() && getConsent().analytics); modal.classList.add('show'); }
    function closeModal() { modal.classList.remove('show'); }
    function commit(analytics) { saveConsent({ necessary: true, analytics: !!analytics, ts: Date.now() }); if (analytics) loadAnalytics(); hideBanner(); closeModal(); }

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) { if (e.target === modal) closeModal(); return; }
      var a = b.getAttribute('data-ck');
      if (a === 'accept') commit(true);
      else if (a === 'reject') commit(false);
      else if (a === 'prefs') openModal();
      else if (a === 'save') commit(aBox.checked);
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); openModal(); }
    });

    // opt-out model: load by default unless the visitor has explicitly rejected
    var c = getConsent();
    if (!c) { loadAnalytics(); showBanner(); }
    else if (c.analytics) loadAnalytics();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
