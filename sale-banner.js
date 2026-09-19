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
      renderBanner(data.sales);
      renderSalePopup(data.sales);
    })
    .catch(function () { /* fail silently — a broken sale widget should never block the site */ });

  function formatCountdown(endsAt) {
    if (!endsAt) return null;
    var diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return null;
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return d + 'd ' + h + 'h left';
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s) + ' left';
  }

  /* ---------- Top banner: first sitewide ("all") sale, if any ---------- */
  function renderBanner(sales) {
    var siteWide = sales.filter(function (s) { return s.applies_to === 'all'; })[0];
    if (!siteWide) return;

    var banner = document.createElement('div');
    banner.id = 'saleBanner';
    banner.textContent = siteWide.name + ' — ' + siteWide.percent_off + '% off sitewide';
    if (siteWide.ends_at) {
      var countdown = formatCountdown(siteWide.ends_at);
      if (countdown) banner.textContent += ' · ' + countdown;
    }
    document.body.insertBefore(banner, document.body.firstChild);

    // Keep the countdown fragment fresh without re-rendering the whole banner.
    if (siteWide.ends_at) {
      setInterval(function () {
        var c = formatCountdown(siteWide.ends_at);
        banner.textContent = siteWide.name + ' — ' + siteWide.percent_off + '% off sitewide' + (c ? ' · ' + c : '');
      }, 1000);
    }
  }

  /* ---------- Centered sale popup (replaces the old bottom-right spotlight) ---------- */

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

  function injectPopupStyles() {
    if (document.getElementById('saleModalStyles')) return;
    var css =
      '.sale-modal-overlay{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;' +
        'background:rgba(5,5,6,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .25s ease;}' +
      '.sale-modal-overlay.is-open{opacity:1;}' +
      '.sale-modal{position:relative;width:min(92vw,460px);max-height:92vh;overflow-y:auto;text-align:center;color:#fff;' +
        'padding:44px 32px 26px;border-radius:20px;background:linear-gradient(135deg,var(--accent-blue,#4d7cff),var(--accent-violet,#8b6cff));' +
        'box-shadow:0 30px 80px rgba(0,0,0,.55);transform:translateY(18px) scale(.96);transition:transform .3s cubic-bezier(.16,.8,.24,1);}' +
      '.sale-modal-overlay.is-open .sale-modal{transform:none;}' +
      '.sale-modal-close{position:absolute;top:14px;right:14px;width:34px;height:34px;border:none;border-radius:50%;' +
        'background:rgba(0,0,0,.25);color:#fff;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;}' +
      '.sale-modal-close:hover{background:rgba(0,0,0,.4);}' +
      '.sale-modal-badge{display:inline-block;font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.16em;' +
        'padding:6px 14px;border-radius:100px;background:rgba(255,255,255,.2);margin-bottom:16px;}' +
      '.sale-modal-name{font-family:var(--font-display,sans-serif);font-weight:600;font-size:22px;margin:0 0 6px;letter-spacing:-.01em;}' +
      '.sale-modal-pct{font-family:var(--font-display,sans-serif);font-weight:700;line-height:1;letter-spacing:-.03em;margin:6px 0 10px;}' +
      '.sale-modal-pct .n{font-size:clamp(72px,20vw,104px);}' +
      '.sale-modal-pct .off{font-size:clamp(28px,8vw,40px);margin-left:8px;}' +
      '.sale-modal-sub{font-size:14px;opacity:.9;margin:0 0 22px;}' +
      '.sale-modal-timer{display:flex;justify-content:center;gap:10px;margin-bottom:24px;}' +
      '.sale-modal-unit{min-width:64px;padding:10px 6px;border-radius:12px;background:rgba(0,0,0,.25);}' +
      '.sale-modal-unit b{display:block;font-family:var(--font-mono,monospace);font-size:26px;font-weight:600;line-height:1.1;}' +
      '.sale-modal-unit span{display:block;font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:.12em;margin-top:4px;opacity:.85;}' +
      '.sale-modal-cta{width:100%;padding:16px 20px;border:none;border-radius:12px;background:#fff;color:#0b0c0e;' +
        'font-family:var(--font-body,sans-serif);font-weight:700;font-size:16px;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease;}' +
      '.sale-modal-cta:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.3);}' +
      '.sale-modal-others{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:18px;}' +
      '.sale-modal-others span{font-family:var(--font-mono,monospace);font-size:11.5px;padding:6px 12px;border-radius:100px;background:rgba(0,0,0,.22);}' +
      '.sale-modal-later{margin-top:16px;background:none;border:none;color:rgba(255,255,255,.85);font-size:13px;text-decoration:underline;cursor:pointer;}' +
      '.sale-modal button:focus-visible{outline:2px solid #fff;outline-offset:3px;}' +
      '@media (prefers-reduced-motion:reduce){.sale-modal-overlay,.sale-modal,.sale-modal-cta{transition:none;}}';
    var style = document.createElement('style');
    style.id = 'saleModalStyles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function renderSalePopup(sales) {
    // Once per visit.
    try { if (sessionStorage.getItem('saleModalSeen')) return; } catch (e) { /* storage blocked — just show it */ }

    // Biggest discount is the headline; the rest show as small chips.
    var list = sales.slice().sort(function (a, b) { return b.percent_off - a.percent_off; });
    var main = list[0];
    var others = list.slice(1);
    // Don't open for a sale that has already ended.
    if (main.ends_at && !timeParts(main.ends_at)) return;

    injectPopupStyles();

    var overlay = document.createElement('div');
    overlay.id = 'saleModal';
    overlay.className = 'sale-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'saleModalTitle');
    overlay.innerHTML =
      '<div class="sale-modal">' +
        '<button type="button" class="sale-modal-close" aria-label="Close">&times;</button>' +
        '<div class="sale-modal-badge">LIMITED TIME</div>' +
        '<h2 class="sale-modal-name" id="saleModalTitle"></h2>' +
        '<div class="sale-modal-pct"><span class="n"></span><span class="off">OFF</span></div>' +
        '<p class="sale-modal-sub">Applied automatically at checkout</p>' +
        '<div class="sale-modal-timer" style="display:none;"></div>' +
        '<button type="button" class="sale-modal-cta">Shop the sale</button>' +
        '<div class="sale-modal-others"></div>' +
        '<button type="button" class="sale-modal-later">Maybe later</button>' +
      '</div>';

    overlay.querySelector('.sale-modal-name').textContent = main.name;
    overlay.querySelector('.sale-modal-pct .n').textContent = main.percent_off + '%';

    var othersEl = overlay.querySelector('.sale-modal-others');
    if (others.length) {
      others.forEach(function (s) {
        var chip = document.createElement('span');
        chip.textContent = s.name + ' · ' + s.percent_off + '% off';
        othersEl.appendChild(chip);
      });
    } else {
      othersEl.style.display = 'none';
    }

    var timerEl = overlay.querySelector('.sale-modal-timer');
    var timerId = null;
    var previousOverflow = '';
    var isClosed = false;

    function tick() {
      var p = timeParts(main.ends_at);
      if (!main.ends_at) { timerEl.style.display = 'none'; return; }
      if (!p) { closePopup(); return; } // sale ended while the popup was open
      var html = '';
      if (p.d > 0) html += '<div class="sale-modal-unit"><b>' + pad(p.d) + '</b><span>DAYS</span></div>';
      html += '<div class="sale-modal-unit"><b>' + pad(p.h) + '</b><span>HRS</span></div>' +
              '<div class="sale-modal-unit"><b>' + pad(p.m) + '</b><span>MIN</span></div>' +
              '<div class="sale-modal-unit"><b>' + pad(p.s) + '</b><span>SEC</span></div>';
      timerEl.innerHTML = html;
      timerEl.style.display = '';
    }

    function onKey(e) { if (e.key === 'Escape') closePopup(); }

    function closePopup() {
      if (isClosed) return;
      isClosed = true;
      clearInterval(timerId);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      try { sessionStorage.setItem('saleModalSeen', '1'); } catch (e) { /* ignore */ }
      overlay.classList.remove('is-open');
      setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 280);
    }

    overlay.querySelector('.sale-modal-close').addEventListener('click', closePopup);
    overlay.querySelector('.sale-modal-later').addEventListener('click', closePopup);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); }); // click outside the card

    overlay.querySelector('.sale-modal-cta').addEventListener('click', function () {
      closePopup();
      var target = document.getElementById('stack');
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    });

    // Give the page a moment to load, then open.
    setTimeout(function () {
      if (isClosed) return;
      document.body.appendChild(overlay);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      tick();
      timerId = setInterval(tick, 1000);
      document.addEventListener('keydown', onKey);
      requestAnimationFrame(function () {
        overlay.classList.add('is-open');
        var cta = overlay.querySelector('.sale-modal-cta');
        if (cta) cta.focus();
      });
    }, 1200);
  }
})();