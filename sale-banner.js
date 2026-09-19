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
      renderSpotlight(data.sales);
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

  /* ---------- Bottom-right spotlight: cycles through all active sales ---------- */
  function renderSpotlight(sales) {
    if (sessionStorage.getItem('saleSpotlightDismissed')) return;

    var el = document.createElement('div');
    el.id = 'saleSpotlight';
    el.innerHTML =
      '<button type="button" class="sale-spotlight-close" aria-label="Close">&times;</button>' +
      '<div class="sale-spotlight-badge">LIMITED TIME</div>' +
      '<div class="sale-spotlight-name"></div>' +
      '<div class="sale-spotlight-pct"></div>' +
      '<div class="sale-spotlight-countdown" style="display:none;"></div>' +
      '<div class="sale-spotlight-dots"></div>';
    document.body.appendChild(el);

    var nameEl = el.querySelector('.sale-spotlight-name');
    var pctEl = el.querySelector('.sale-spotlight-pct');
    var countdownEl = el.querySelector('.sale-spotlight-countdown');
    var dotsEl = el.querySelector('.sale-spotlight-dots');
    var closeBtn = el.querySelector('.sale-spotlight-close');

    sales.forEach(function (_, i) {
      var dot = document.createElement('span');
      dot.className = 'sale-spotlight-dot' + (i === 0 ? ' is-active' : '');
      dotsEl.appendChild(dot);
    });
    var dots = dotsEl.querySelectorAll('.sale-spotlight-dot');

    var index = 0;
    function paint() {
      var s = sales[index];
      nameEl.textContent = s.name;
      pctEl.textContent = s.percent_off + '% OFF';
      var c = formatCountdown(s.ends_at);
      if (c) { countdownEl.textContent = c; countdownEl.style.display = ''; }
      else { countdownEl.style.display = 'none'; }
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
    }
    paint();

    setInterval(function () {
      var s = sales[index];
      var c = formatCountdown(s.ends_at);
      if (c) countdownEl.textContent = c;
    }, 1000);

    if (sales.length > 1) {
      setInterval(function () {
        el.classList.add('is-fading');
        setTimeout(function () {
          index = (index + 1) % sales.length;
          paint();
          el.classList.remove('is-fading');
        }, 200);
      }, 5000);
    }

    requestAnimationFrame(function () { el.classList.add('is-visible'); });

    closeBtn.addEventListener('click', function () {
      el.classList.add('is-closing');
      sessionStorage.setItem('saleSpotlightDismissed', '1');
      setTimeout(function () { el.remove(); }, 350);
    });
  }
})();