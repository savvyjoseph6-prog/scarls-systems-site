(function () {
  'use strict';

  var SUPABASE_URL = "https://zpytjifbhaxniuliopvp.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXRqaWZiaGF4bml1bGlvcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTMyNjgsImV4cCI6MjEwMzg2OTI2OH0.QFGo9feUbsle_fGxNZvxMaBuRQzS55RKF2_i0oL0LYQ";
  var SUPABASE_FUNCTIONS_BASE = SUPABASE_URL + "/functions/v1";

  fetch(SUPABASE_FUNCTIONS_BASE + '/public-active-sales', {
    headers: { 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'apikey': SUPABASE_ANON_KEY }
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data || !data.ok || !data.sales || !data.sales.length) return;
      // Never show a sale that has already ended, even if the server still lists it.
      var sales = data.sales.filter(isStillRunning);
      if (!sales.length) return;
      renderBanner(sales);
      if (shouldShowPopup(data.popupFrequency)) renderModal(sales, data.popupFrequency);
    })
    .catch(function () { /* fail silently — a broken sale widget should never block the site */ });

  // Announcement banner (message, link, colour, expiry — all managed from the admin page).
  fetch(SUPABASE_FUNCTIONS_BASE + '/public-site-announcement', {
    headers: { 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'apikey': SUPABASE_ANON_KEY }
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.ok && data.announcement) renderAnnouncement(data.announcement);
    })
    .catch(function () { /* fail silently — a broken banner should never block the site */ });

  /* ---------- Small helpers ---------- */

  function isStillRunning(sale) {
    if (!sale.ends_at) return true;
    var t = new Date(sale.ends_at).getTime();
    return isNaN(t) || t > Date.now();
  }

  // Browsers can block storage (private modes, strict settings) — never let that break the widget.
  function storageGet(store, key) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function storageSet(store, key, value) {
    try { window[store].setItem(key, value); } catch (e) { /* ignore */ }
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function timeParts(endsAt) {
    if (!endsAt) return null;
    var diff = new Date(endsAt).getTime() - Date.now();
    if (isNaN(diff) || diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000)
    };
  }

  function formatCountdown(endsAt) {
    var p = timeParts(endsAt);
    if (!p) return null;
    if (p.d > 0) return p.d + 'd ' + p.h + 'h left';
    return pad(p.h) + ':' + pad(p.m) + ':' + pad(p.s) + ' left';
  }

  /* ---------- Decide whether to show the popup this load, per admin setting ---------- */
  function shouldShowPopup(frequency) {
    frequency = frequency || 'always';

    if (frequency === 'always') return true;

    if (frequency === 'once_per_session') {
      return !storageGet('sessionStorage', 'salePopupShown');
    }

    if (frequency.indexOf('hours:') === 0) {
      var hours = Number(frequency.split(':')[1]) || 1;
      var last = storageGet('localStorage', 'salePopupLastShown');
      if (!last) return true;
      var elapsedHours = (Date.now() - Number(last)) / 3600000;
      return elapsedHours >= hours;
    }

    return true;
  }

  function markPopupShown(frequency) {
    if (frequency === 'once_per_session') storageSet('sessionStorage', 'salePopupShown', '1');
    else if (frequency && frequency.indexOf('hours:') === 0) storageSet('localStorage', 'salePopupLastShown', String(Date.now()));
  }

  /* ---------- Pinned top bars (announcement + sale banner) ---------- */
  // Both banners live inside one fixed container at the top of the screen, so they
  // stack neatly and stay visible while scrolling. The container's height is
  // published as --sale-banner-h, and the site's own menu bar is moved down by that
  // amount (see injectBarStyles) so nothing overlaps.
  var topBars = null;
  var topBarsSync = null;
  var topBarsObserver = null;

  function getTopBars() {
    if (topBars) return topBars;
    injectBarStyles();
    var root = document.documentElement;
    var bars = document.createElement('div');
    bars.id = 'topBars';
    document.body.insertBefore(bars, document.body.firstChild);
    topBars = bars;
    topBarsSync = function () { root.style.setProperty('--sale-banner-h', bars.offsetHeight + 'px'); };
    root.classList.add('has-sale-banner');
    topBarsSync();
    window.addEventListener('resize', topBarsSync);
    if ('ResizeObserver' in window) {
      topBarsObserver = new ResizeObserver(topBarsSync); // the text can wrap on small screens
      topBarsObserver.observe(bars);
    }
    return topBars;
  }

  // Call after removing a bar: tidies everything up once no bars are left.
  function releaseTopBars() {
    if (!topBars || topBars.children.length) return;
    window.removeEventListener('resize', topBarsSync);
    if (topBarsObserver) { topBarsObserver.disconnect(); topBarsObserver = null; }
    var root = document.documentElement;
    root.classList.remove('has-sale-banner');
    root.style.removeProperty('--sale-banner-h');
    if (topBars.parentNode) topBars.parentNode.removeChild(topBars);
    topBars = null;
  }

  function injectBarStyles() {
    if (document.getElementById('topBarStyles')) return;
    var style = document.createElement('style');
    style.id = 'topBarStyles';
    style.textContent =
      // Fixed to the top of the screen, above the menu bar (z-index 100) but below pop-ups.
      '#topBars{position:fixed;top:0;left:0;right:0;z-index:150;}' +
      '#topBars > #saleBanner{position:static !important;margin:0 !important;}' +
      // Keep the page content where it was, and slide the menu bar down under the bars.
      'html.has-sale-banner body{padding-top:var(--sale-banner-h,0px);}' +
      'html.has-sale-banner .nav{top:var(--sale-banner-h,0px);}' +
      'html.has-sale-banner{scroll-padding-top:var(--sale-banner-h,0px);}' +
      // Announcement banner
      '#siteAnnouncement{position:relative;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 12px;' +
        'padding:11px 46px 11px 16px;text-align:center;font-family:var(--font-body,sans-serif);font-size:14px;font-weight:500;' +
        'line-height:1.4;color:#fff;border-bottom:1px solid rgba(255,255,255,.12);}' +
      '#siteAnnouncement.style-info{background:#1d2b53;}' +
      '#siteAnnouncement.style-success{background:#12513a;}' +
      '#siteAnnouncement.style-warning{background:#7a5200;}' +
      '#siteAnnouncement .announcement-link{color:#fff;font-weight:700;text-decoration:underline;white-space:nowrap;}' +
      '#siteAnnouncement .announcement-countdown{font-family:var(--font-mono,monospace);font-size:13px;padding:3px 10px;' +
        'border-radius:100px;background:rgba(0,0,0,.25);white-space:nowrap;}' +
      '#siteAnnouncement .announcement-close{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:28px;height:28px;' +
        'border:none;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:18px;line-height:1;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;}' +
      '#siteAnnouncement .announcement-close:hover{background:rgba(255,255,255,.28);}';
    document.head.appendChild(style);
  }

  /* ---------- Sale banner: first sitewide ("all") sale, if any ---------- */
  function renderBanner(sales) {
    var siteWide = sales.filter(function (s) { return s.applies_to === 'all'; })[0];
    if (!siteWide) return;

    var banner = document.createElement('div');
    banner.id = 'saleBanner';
    var base = siteWide.name + ' — ' + siteWide.percent_off + '% off sitewide';
    var countdown = formatCountdown(siteWide.ends_at);
    banner.textContent = base + (countdown ? ' · ' + countdown : '');
    getTopBars().appendChild(banner);

    if (siteWide.ends_at) {
      var bannerTimer = setInterval(function () {
        var c = formatCountdown(siteWide.ends_at);
        if (!c) {
          // The sale just ended while the page was open — take the banner down.
          clearInterval(bannerTimer);
          if (banner.parentNode) banner.parentNode.removeChild(banner);
          releaseTopBars();
          return;
        }
        banner.textContent = base + ' · ' + c;
      }, 1000);
    }
  }

  /* ---------- Announcement banner (managed from the admin page) ---------- */

  // Only web addresses, site-relative paths and #anchors are allowed as links.
  function safeUrl(u) {
    u = String(u || '').trim();
    if (/^https?:\/\//i.test(u) || /^\/(?!\/)/.test(u) || /^#/.test(u)) return u;
    return '';
  }

  function renderAnnouncement(a) {
    if (!a || !a.text) return;

    // Optional: only show on one website address (e.g. the old address after a move).
    if (a.only_on_host) {
      var here = window.location.hostname.toLowerCase().replace(/^www\./, '');
      var wanted = String(a.only_on_host).toLowerCase().replace(/^www\./, '');
      if (here !== wanted) return;
    }

    // A visitor's "close" is remembered for this version of the message only,
    // so a newly saved message shows up for them again.
    if (a.dismissible && storageGet('localStorage', 'announcementDismissed') === String(a.version)) return;

    if (a.ends_at) {
      var endTime = new Date(a.ends_at).getTime();
      if (!isNaN(endTime) && endTime <= Date.now()) return;
    }

    var bar = document.createElement('div');
    bar.id = 'siteAnnouncement';
    bar.className = 'style-' + (['info', 'success', 'warning'].indexOf(a.style) >= 0 ? a.style : 'info');
    bar.setAttribute('role', 'status');

    var msg = document.createElement('span');
    msg.className = 'announcement-text';
    msg.textContent = a.text;
    bar.appendChild(msg);

    // Optional live countdown to the hide date.
    var countdownEl = null;
    if (a.show_countdown && a.ends_at) {
      countdownEl = document.createElement('span');
      countdownEl.className = 'announcement-countdown';
      bar.appendChild(countdownEl);
    }
    function paintCountdown() {
      if (countdownEl) countdownEl.textContent = formatCountdown(a.ends_at) || '';
    }

    var url = safeUrl(a.link_url);
    if (url) {
      var link = document.createElement('a');
      link.className = 'announcement-link';
      link.href = url;
      link.textContent = a.link_text || 'Learn more';
      if (/^https?:/i.test(url)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      bar.appendChild(link);
    }

    var expiryTimer = null;
    function removeBar() {
      clearInterval(expiryTimer);
      if (bar.parentNode) bar.parentNode.removeChild(bar);
      releaseTopBars();
    }

    if (a.dismissible) {
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'announcement-close';
      close.setAttribute('aria-label', 'Close announcement');
      close.innerHTML = '&times;';
      close.addEventListener('click', function () {
        storageSet('localStorage', 'announcementDismissed', String(a.version));
        removeBar();
      });
      bar.appendChild(close);
    }

    var container = getTopBars();
    container.insertBefore(bar, container.firstChild); // announcement sits above the sale banner

    if (a.ends_at) {
      paintCountdown();
      // Tick every second when a countdown is showing, otherwise just check now and then.
      expiryTimer = setInterval(function () {
        var t = new Date(a.ends_at).getTime();
        if (!isNaN(t) && t <= Date.now()) { removeBar(); return; }
        paintCountdown();
      }, countdownEl ? 1000 : 30000);
    }
  }

  /* ---------- Big centered modal popup, Jumia-style ---------- */
  function renderModal(sales, frequency) {
    injectModalStyles();
    markPopupShown(frequency);

    var slides = sales.slice();
    var index = 0;
    var isClosed = false;
    var scrollLocked = false;
    var previousOverflow = '';
    var tickId = null;
    var rotateId = null;

    var overlay = document.createElement('div');
    overlay.id = 'salePopupOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'salePopupTitle');
    overlay.innerHTML =
      '<div id="salePopupCard">' +
        '<button type="button" id="salePopupClose" aria-label="Close">&times;</button>' +
        '<div class="sale-popup-badge">LIMITED TIME</div>' +
        '<h2 class="sale-popup-name" id="salePopupTitle"></h2>' +
        '<div class="sale-popup-pct"><span class="n"></span><span class="off">OFF</span></div>' +
        '<p class="sale-popup-sub">Applied automatically at checkout</p>' +
        '<div class="sale-popup-timer" style="display:none;"></div>' +
        '<button type="button" class="sale-popup-cta">Shop the sale</button>' +
        '<div class="sale-popup-dots"></div>' +
        '<button type="button" class="sale-popup-later">Maybe later</button>' +
      '</div>';
    document.body.appendChild(overlay);

    var nameEl = overlay.querySelector('.sale-popup-name');
    var nEl = overlay.querySelector('.sale-popup-pct .n');
    var timerEl = overlay.querySelector('.sale-popup-timer');
    var dotsEl = overlay.querySelector('.sale-popup-dots');
    var closeBtn = overlay.querySelector('#salePopupClose');
    var ctaBtn = overlay.querySelector('.sale-popup-cta');
    var laterBtn = overlay.querySelector('.sale-popup-later');

    function buildDots() {
      dotsEl.innerHTML = '';
      if (slides.length < 2) { dotsEl.style.display = 'none'; return; }
      dotsEl.style.display = '';
      slides.forEach(function () {
        var dot = document.createElement('span');
        dot.className = 'sale-popup-dot';
        dotsEl.appendChild(dot);
      });
    }

    function renderTimer() {
      var current = slides[index];
      var p = current ? timeParts(current.ends_at) : null;
      if (!p) { timerEl.style.display = 'none'; return; }
      var html = '';
      if (p.d > 0) html += '<div class="sale-popup-unit"><b>' + pad(p.d) + '</b><span>DAYS</span></div>';
      html += '<div class="sale-popup-unit"><b>' + pad(p.h) + '</b><span>HRS</span></div>' +
              '<div class="sale-popup-unit"><b>' + pad(p.m) + '</b><span>MIN</span></div>' +
              '<div class="sale-popup-unit"><b>' + pad(p.s) + '</b><span>SEC</span></div>';
      timerEl.innerHTML = html;
      timerEl.style.display = '';
    }

    function paint() {
      if (index >= slides.length) index = 0;
      var s = slides[index];
      nameEl.textContent = s.name;
      nEl.textContent = s.percent_off + '%';
      renderTimer();
      var dots = dotsEl.querySelectorAll('.sale-popup-dot');
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
    }

    function onKey(e) { if (e.key === 'Escape') closePopup(); }

    function closePopup() {
      if (isClosed) return;
      isClosed = true;
      clearInterval(tickId);
      clearInterval(rotateId);
      document.removeEventListener('keydown', onKey);
      if (scrollLocked) document.body.style.overflow = previousOverflow;
      overlay.classList.remove('is-visible');
      overlay.classList.add('is-closing');
      setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
    }

    buildDots();
    paint();

    // Every second: refresh the countdown, and drop any sale that has just ended.
    tickId = setInterval(function () {
      var before = slides.length;
      slides = slides.filter(isStillRunning);
      if (!slides.length) { closePopup(); return; }
      if (slides.length !== before) { buildDots(); paint(); return; }
      renderTimer();
    }, 1000);

    // Rotate through the sales when more than one is active.
    rotateId = setInterval(function () {
      if (slides.length < 2) return;
      overlay.classList.add('is-fading');
      setTimeout(function () {
        index = (index + 1) % slides.length;
        paint();
        overlay.classList.remove('is-fading');
      }, 200);
    }, 5000);

    closeBtn.addEventListener('click', closePopup);
    laterBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); }); // click outside the card

    ctaBtn.addEventListener('click', function () {
      closePopup();
      var target = document.getElementById('stack');
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    });

    // Fade in shortly after the page has loaded.
    setTimeout(function () {
      if (isClosed) return;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      scrollLocked = true;
      overlay.classList.add('is-visible');
      document.addEventListener('keydown', onKey);
      ctaBtn.focus();
    }, 400);
  }

  function injectModalStyles() {
    if (document.getElementById('salePopupStyles')) return;
    var style = document.createElement('style');
    style.id = 'salePopupStyles';
    style.textContent =
      '#salePopupOverlay{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;' +
        'background:rgba(5,5,6,0);opacity:0;pointer-events:none;transition:opacity .3s ease, background .3s ease;}' +
      '#salePopupOverlay.is-visible{opacity:1;pointer-events:auto;background:rgba(5,5,6,.72);' +
        '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}' +
      '#salePopupOverlay.is-closing{opacity:0;pointer-events:none;}' +
      '#salePopupCard{position:relative;width:min(460px,100%);max-height:92vh;overflow-y:auto;text-align:center;color:#fff;' +
        'padding:44px 32px 26px;border-radius:20px;' +
        'background:var(--accent-grad,linear-gradient(135deg,#4d7cff,#8b6cff));' +
        'box-shadow:0 30px 80px rgba(0,0,0,.55);transform:translateY(24px) scale(.96);' +
        'transition:transform .35s cubic-bezier(.16,.8,.24,1);}' +
      '#salePopupOverlay.is-visible #salePopupCard{transform:none;}' +
      '#salePopupClose{position:absolute;top:14px;right:14px;width:34px;height:34px;border:none;border-radius:50%;' +
        'background:rgba(0,0,0,.25);color:#fff;font-size:22px;line-height:1;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;}' +
      '#salePopupClose:hover{background:rgba(0,0,0,.4);}' +
      '.sale-popup-badge{display:inline-block;font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.16em;' +
        'padding:6px 14px;border-radius:100px;background:rgba(255,255,255,.2);margin-bottom:16px;}' +
      '.sale-popup-name,.sale-popup-pct,.sale-popup-timer{transition:opacity .2s ease;}' +
      '.sale-popup-name{font-family:var(--font-display,sans-serif);font-weight:600;font-size:22px;margin:0 0 6px;letter-spacing:-.01em;}' +
      '.sale-popup-pct{font-family:var(--font-display,sans-serif);font-weight:700;line-height:1;letter-spacing:-.03em;margin:6px 0 10px;}' +
      '.sale-popup-pct .n{font-size:clamp(72px,20vw,104px);}' +
      '.sale-popup-pct .off{font-size:clamp(28px,8vw,40px);margin-left:8px;}' +
      '.sale-popup-sub{font-size:14px;opacity:.9;margin:0 0 22px;}' +
      '.sale-popup-timer{display:flex;justify-content:center;gap:10px;margin-bottom:24px;}' +
      '.sale-popup-unit{min-width:64px;padding:10px 6px;border-radius:12px;background:rgba(0,0,0,.25);}' +
      '.sale-popup-unit b{display:block;font-family:var(--font-mono,monospace);font-size:26px;font-weight:600;line-height:1.1;}' +
      '.sale-popup-unit span{display:block;font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:.12em;margin-top:4px;opacity:.85;}' +
      '.sale-popup-cta{width:100%;padding:16px 20px;border:none;border-radius:12px;background:#fff;color:#0b0c0e;' +
        'font-family:var(--font-body,sans-serif);font-weight:700;font-size:16px;cursor:pointer;' +
        'transition:transform .2s ease,box-shadow .2s ease;}' +
      '.sale-popup-cta:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.3);}' +
      '#salePopupOverlay.is-fading .sale-popup-name,#salePopupOverlay.is-fading .sale-popup-pct,#salePopupOverlay.is-fading .sale-popup-timer{opacity:0;}' +
      '.sale-popup-dots{display:flex;gap:7px;justify-content:center;margin-top:18px;}' +
      '.sale-popup-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.35);}' +
      '.sale-popup-dot.is-active{background:#fff;}' +
      '.sale-popup-later{margin-top:16px;background:none;border:none;color:rgba(255,255,255,.85);font-size:13px;' +
        'text-decoration:underline;cursor:pointer;}' +
      '#salePopupCard button:focus-visible{outline:2px solid #fff;outline-offset:3px;}' +
      '@media (max-width:480px){#salePopupCard{padding:36px 22px 22px;}.sale-popup-unit{min-width:56px;}}' +
      '@media (prefers-reduced-motion:reduce){#salePopupOverlay,#salePopupCard,.sale-popup-cta{transition:none;}}';
    document.head.appendChild(style);
  }
})();