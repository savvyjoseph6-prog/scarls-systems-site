(function () {
  'use strict';

  // Paste the Google Apps Script Web App URL here after deploying backend/Code.gs
  // (Deploy → New deployment → Web app → copy the URL it gives you)
  var SCARLS_FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbyxho_eYGdD2g3OXzc2IzCEh2hqsDeH2Zonoi9RenZanSoz0uqo7uxcqP8rDK0lnC_f/exec";

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 24) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', function () {
    var isOpen = mobileMenu.classList.toggle('is-open');
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileMenu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal, .flow-step, .flow-connector, .process-step');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Hero growth diagram: sequential node activation ---------- */
  var nodeGroups = document.querySelectorAll('.gd-node-group');
  nodeGroups.forEach(function (g, i) {
    setTimeout(function () {
      g.classList.add('is-in');
    }, 120 * i);
  });

  if (!prefersReducedMotion && nodeGroups.length) {
    var activeIndex = 0;
    function activateNext() {
      nodeGroups.forEach(function (g) { g.classList.remove('is-active'); });
      nodeGroups[activeIndex].classList.add('is-active');
      activeIndex = (activeIndex + 1) % nodeGroups.length;
    }
    activateNext();
    setInterval(activateNext, 900);
  } else {
    nodeGroups.forEach(function (g) { g.classList.add('is-active'); });
  }

  /* ---------- Contact form submission ---------- */
  var form = document.getElementById('projectForm');
  var success = document.getElementById('formSuccess');
  var submitBtn = document.getElementById('submitBtn');

  var formError = document.getElementById('formError');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var payload = {
      fullName: form.fullName.value.trim(),
      businessName: form.businessName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      website: form.website.value.trim(),
      businessType: form.businessType.value,
      needHelp: form.needHelp.value,
      revenue: form.revenue.value,
      budget: form.budget.value,
      challenge: form.challenge.value.trim(),
      projectDetails: form.projectDetails.value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    if (formError) formError.classList.remove('is-visible');

    if (!SCARLS_FORM_ENDPOINT || SCARLS_FORM_ENDPOINT.indexOf('PASTE_YOUR') === 0) {
      console.warn('SCARLS_FORM_ENDPOINT is not configured yet — see backend/Code.gs setup steps.');
      showSuccess();
      return;
    }

    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      // text/plain avoids a CORS preflight against Apps Script's Web App endpoint
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) {
          showSuccess();
        } else {
          showError(data && data.error ? data.error : 'Something went wrong. Please try again.');
        }
      })
      .catch(function () {
        showError('Could not reach the server. Please check your connection and try again.');
      });
  });

  function showSuccess() {
    form.style.display = 'none';
    success.classList.add('is-visible');
    success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  }

  function showError(message) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Project Inquiry';
    if (formError) {
      formError.textContent = message;
      formError.classList.add('is-visible');
    }
  }
})();
