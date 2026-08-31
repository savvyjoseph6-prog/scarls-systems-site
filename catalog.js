(function () {
  'use strict';

  // Local fallback data (data/catalog.js) — used immediately on load so
  // the page is never blank, and kept as a safety net if the live
  // backend catalog can't be reached. If the backend fetch below
  // succeeds, CATALOG is swapped for the live version and the grid
  // re-renders automatically.
  var CATALOG = window.SCARLS_CATALOG;
  if (!CATALOG) return;

  // Same endpoint the existing contact form posts to (backend/Code.gs).
  // GET ?action=catalog reads the Categories/Services/Packages sheets
  // and returns them in this exact shape — edit the sheets, not this
  // file, to change what's live on the site.
  // The "Make an Offer" submission below posts here too, tagged
  // action:"offer".
  var SCARLS_FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbyxho_eYGdD2g3OXzc2IzCEh2hqsDeH2Zonoi9RenZanSoz0uqo7uxcqP8rDK0lnC_f/exec";

  // Public key — safe to expose in frontend code. Get yours from your
  // Paystack dashboard (Settings → API Keys & Webhooks). The matching
  // SECRET key lives only in Apps Script Script Properties, never here.
  var PAYSTACK_PUBLIC_KEY = "pk_live_076f25749e6c5c488f536bbfd69161646571258e";

  // Mirrors the same check PaymentEngine.gs makes server-side. A service
  // can only skip straight to Paystack checkout if its price is a single
  // clean figure (e.g. "₦20,000" or "₦200,000/mo") — ranges, "+", and
  // "Custom" all need a human-scoped quote via Make an Offer instead.
  function isFixedPriceLabel(label) {
    return !!label && /^₦[\d,]+(\/mo)?$/.test(label.trim());
  }

  function isValidCatalog(c) {
    return c && Array.isArray(c.categories) && c.categories.length &&
      Array.isArray(c.services) && c.services.length;
  }

  function fetchLiveCatalog() {
    if (!SCARLS_FORM_ENDPOINT || SCARLS_FORM_ENDPOINT.indexOf('PASTE_YOUR') === 0) return;

    fetch(SCARLS_FORM_ENDPOINT + '?action=catalog')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok && isValidCatalog(data.catalog)) {
          CATALOG = data.catalog;
          renderTabs();
          renderGrid();
        } else {
          console.warn('Live catalog unavailable or empty — using bundled fallback catalog.');
        }
      })
      .catch(function (err) {
        console.warn('Could not reach live catalog, using bundled fallback catalog.', err);
      });
  }

  function nairaLabel(svc) {
    return svc.price_label || (svc.starting_price ? "₦" + svc.starting_price.toLocaleString() : "Custom");
  }

  function activeCategories() {
    return CATALOG.categories.filter(function (c) { return c.active; }).sort(function (a, b) { return a.order - b.order; });
  }
  function servicesFor(categoryId) {
    return CATALOG.services
      .filter(function (s) { return s.category_id === categoryId && s.active; })
      .sort(function (a, b) { return a.order - b.order; });
  }
  function findService(id) { return CATALOG.services.filter(function (s) { return s.id === id; })[0]; }

  /* ---------------- Tabs ---------------- */
  var tabsEl = document.getElementById('catalogTabs');
  var taglineEl = document.getElementById('catalogTagline');
  var gridEl = document.getElementById('catalogGrid');
  var currentCategory = 'acquire';

  function renderTabs() {
    var cats = activeCategories();
    tabsEl.innerHTML = cats.map(function (c) {
      return '<button type="button" class="catalog-tab' + (c.id === currentCategory ? ' is-active' : '') +
        '" data-cat="' + c.id + '" role="tab" aria-selected="' + (c.id === currentCategory) + '">' + c.name + '</button>';
    }).join('');

    tabsEl.querySelectorAll('.catalog-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentCategory = btn.getAttribute('data-cat');
        renderTabs();
        renderGrid();
      });
    });
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function renderGrid() {
    var cat = CATALOG.categories.filter(function (c) { return c.id === currentCategory; })[0];
    taglineEl.textContent = cat ? cat.tagline : '';
    var list = servicesFor(currentCategory);

    gridEl.innerHTML = list.map(function (svc) {
      if (svc.is_offer_cta) {
        return '<div class="catalog-cta-card" data-offer-cta="1">' +
          '<p class="eyebrow" style="margin-bottom:0;">Custom Project</p>' +
          '<h3>' + escapeHtml(svc.name) + '</h3>' +
          '<p>' + escapeHtml(svc.short_description) + '</p>' +
          '<span class="btn btn-primary">Make an Offer' +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3M11 3H4M11 3V10" stroke="currentColor" stroke-width="1.4"/></svg></span>' +
          '</div>';
      }
      var badges = '';
      if (svc.coming_soon) badges += '<span class="badge badge-soon">Coming Soon</span>';
      if (svc.featured && !svc.coming_soon) badges += '<span class="badge badge-featured">Featured</span>';
      if ((svc.pricing_model === 'subscription' || svc.pricing_model === 'both') && !svc.coming_soon) badges += '<span class="badge badge-sub">Subscription</span>';

      return '<div class="catalog-card" data-service="' + svc.id + '">' +
        '<div class="catalog-card-top"><div class="catalog-card-badges">' + badges + '</div></div>' +
        '<h3>' + escapeHtml(svc.name) + '</h3>' +
        '<p>' + escapeHtml(svc.short_description) + '</p>' +
        '<div class="catalog-card-price"><span>' + escapeHtml(nairaLabel(svc)) + '</span><span>' + escapeHtml(svc.delivery_time || '') + '</span></div>' +
        '</div>';
    }).join('');

    gridEl.querySelectorAll('[data-service]').forEach(function (card) {
      card.addEventListener('click', function () { openServiceModal(card.getAttribute('data-service')); });
    });
    var ctaCard = gridEl.querySelector('[data-offer-cta]');
    if (ctaCard) ctaCard.addEventListener('click', openOfferModal);
  }

  /* ---------------- Service detail modal ---------------- */
  var serviceOverlay = document.getElementById('serviceModalOverlay');
  var serviceContent = document.getElementById('serviceModalContent');
  var selectedPackage = null;
  var selectedPricingModel = null;

  function listBlock(title, items, cls) {
    if (!items || !items.length) return '';
    return '<div class="scarls-modal-section"><h4>' + title + '</h4><ul class="' + (cls || '') + '">' +
      items.map(function (i) { return '<li>' + escapeHtml(i) + '</li>'; }).join('') + '</ul></div>';
  }

  function packageBlock(svc) {
    if (!svc.packages || !svc.packages.length) return '';
    selectedPackage = svc.packages.filter(function (p) { return p.active; })[0] || null;
    if (svc.packages.some(function (p) { return p.recommended; })) {
      selectedPackage = svc.packages.filter(function (p) { return p.recommended && p.active; })[0] || selectedPackage;
    }
    var cards = svc.packages.filter(function (p) { return p.active; }).map(function (p) {
      return '<div class="package-card' + (p.id === selectedPackage.id ? ' is-selected' : '') + '" data-pkg="' + p.id + '">' +
        (p.recommended ? '<span class="recommended-tag">Recommended</span>' : '') +
        '<h5>' + escapeHtml(p.name) + '</h5>' +
        '<div class="package-price">' + escapeHtml(p.price_label) + '</div>' +
        '<p>' + escapeHtml(p.description) + '</p>' +
        '<ul>' + (p.features || []).map(function (f) { return '<li>' + escapeHtml(f) + '</li>'; }).join('') + '</ul>' +
        '</div>';
    }).join('');
    return '<div class="scarls-modal-section"><h4>Choose a Package</h4><div class="package-grid" id="packageGrid">' + cards + '</div></div>';
  }

  function pricingToggleBlock(svc) {
    if (svc.pricing_model !== 'both') { selectedPricingModel = svc.pricing_model; return ''; }
    selectedPricingModel = 'one_time';
    return '<div class="pricing-toggle" id="pricingToggle">' +
      '<button type="button" class="is-active" data-model="one_time">One-Time Payment</button>' +
      '<button type="button" data-model="subscription">Monthly Subscription</button>' +
      '</div>';
  }

  function resolveCheckout_(svc) {
    if (svc.coming_soon || svc.is_offer_cta) return null;

    if (selectedPackage) {
      return {
        serviceId: svc.id, packageId: selectedPackage.id, pricingModel: 'one_time',
        amountNaira: selectedPackage.price, priceLabel: selectedPackage.price_label,
        serviceName: svc.name, packageName: selectedPackage.name
      };
    }

    var model = selectedPricingModel || svc.pricing_model;
    if (model !== 'one_time' && model !== 'subscription') return null;

    var price, label;
    if (svc.pricing_model === 'both' && model === 'subscription') {
      price = svc.subscription_price; label = svc.subscription_label;
    } else {
      price = svc.starting_price; label = svc.price_label;
    }

    if (price == null || !isFixedPriceLabel(label)) return null;

    return {
      serviceId: svc.id, packageId: null, pricingModel: model,
      amountNaira: price, priceLabel: label, serviceName: svc.name, packageName: ''
    };
  }

  function openServiceModal(id) {
    var svc = findService(id);
    if (!svc) return;
    selectedPackage = null;
    selectedPricingModel = null;

    var cat = CATALOG.categories.filter(function (c) { return c.id === svc.category_id; })[0];
    var priceLabel = nairaLabel(svc);

    var html = '';
    html += '<p class="eyebrow">' + escapeHtml(cat ? cat.name : '') + '</p>';
    html += '<h2 id="serviceModalTitle">' + escapeHtml(svc.name) + '</h2>';
    html += '<p class="scarls-modal-lede">' + escapeHtml(svc.full_description) + '</p>';

    if (svc.combo_note) html += '<div class="combo-note">' + escapeHtml(svc.combo_note) + '</div>';
    if (svc.requires_consultation && !svc.coming_soon) {
      html += '<div class="combo-note">This service begins with a short SCARLS consultation so we can scope it correctly for your business — you won\'t be charged until a plan is agreed.</div>';
    }
    if (svc.requires_budget_check && !svc.coming_soon) {
      var minLabel = '₦' + (Number(svc.min_budget) || 0).toLocaleString() + '/' + (svc.min_budget_period || 'daily');
      html += '<div class="combo-note">This service requires a minimum ' + escapeHtml(minLabel) + ' budget of your own (e.g. ad spend) to be effective. We\'ll do a quick check before checkout.</div>';
    }
    if (svc.requires_ai_quote && !svc.coming_soon) {
      html += '<div class="combo-note">You set your own ad budget and how many days to run — we\'ll work out a total together before checkout.</div>';
    }

    if (svc.coming_soon) {
      html += '<div class="scarls-modal-price">Coming Soon</div>';
    } else if (svc.requires_ai_quote) {
      html += '<div class="scarls-modal-price">You Set The Budget</div>';
    } else {
      html += pricingToggleBlock(svc);
      html += '<div class="scarls-modal-price" id="modalPriceDisplay">' + escapeHtml(priceLabel) + '</div>';
      html += packageBlock(svc);
    }

    html += '<div class="scarls-modal-meta">';
    if (svc.delivery_time) html += '<div><strong>Delivery Time</strong>' + escapeHtml(svc.delivery_time) + '</div>';
    if (svc.who_for) html += '<div><strong>Who It\'s For</strong>' + escapeHtml(svc.who_for) + '</div>';
    html += '</div>';

    html += listBlock('What\'s Included', svc.included);
    html += listBlock('Not Included', svc.excluded, 'excluded');
    html += listBlock('Deliverables', svc.deliverables);
    html += listBlock('What We Need From You', svc.requirements);

    if (svc.related && svc.related.length) {
      var relNames = svc.related.map(findService).filter(Boolean);
      if (relNames.length) {
        html += '<div class="scarls-modal-section"><h4>Often Paired With</h4><div class="scarls-modal-related">' +
          relNames.map(function (r) { return '<span data-service="' + r.id + '">' + escapeHtml(r.name) + '</span>'; }).join('') +
          '</div></div>';
      }
    }

    if (!svc.coming_soon) {
      html += '<div class="scarls-modal-actions">' +
        '<button type="button" class="btn btn-primary" id="chooseServiceBtn">Choose Service' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3M11 3H4M11 3V10" stroke="currentColor" stroke-width="1.4"/></svg></button>' +
        '<button type="button" class="btn btn-ghost" id="askAboutServiceBtn">Ask SCARLS About This</button>' +
        '</div>';
    }

    serviceContent.innerHTML = html;
    serviceOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Package selection
    var pkgGrid = document.getElementById('packageGrid');
    if (pkgGrid) {
      pkgGrid.querySelectorAll('.package-card').forEach(function (card) {
        card.addEventListener('click', function () {
          var pkg = svc.packages.filter(function (p) { return p.id === card.getAttribute('data-pkg'); })[0];
          selectedPackage = pkg;
          pkgGrid.querySelectorAll('.package-card').forEach(function (c) { c.classList.remove('is-selected'); });
          card.classList.add('is-selected');
          document.getElementById('modalPriceDisplay').textContent = pkg.price_label;
        });
      });
    }

    // One-time / subscription toggle
    var toggle = document.getElementById('pricingToggle');
    if (toggle) {
      toggle.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectedPricingModel = btn.getAttribute('data-model');
          toggle.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          var label = selectedPricingModel === 'subscription' && svc.subscription_label ? svc.subscription_label : priceLabel;
          document.getElementById('modalPriceDisplay').textContent = label;
        });
      });
    }

    // Related service chips
    serviceContent.querySelectorAll('[data-service]').forEach(function (chip) {
      chip.addEventListener('click', function () { openServiceModal(chip.getAttribute('data-service')); });
    });

    var chooseBtn = document.getElementById('chooseServiceBtn');
    if (chooseBtn) {
      chooseBtn.addEventListener('click', function () {
        closeServiceModal();
        // Budget-gated services (Phase 5) open a short eligibility chat
        // before checkout — checked first since it's the narrower gate.
        if (svc.requires_budget_check) {
          openBudgetChatModal(svc);
          return;
        }
        // AI-quoted services (Phase 6) open a chat that drafts a custom
        // total from the client's own ad budget — checked before the
        // consultation gate since it's also a narrower, service-specific
        // path straight to a (drafted) checkout, not a human meeting.
        if (svc.requires_ai_quote) {
          openAiQuoteModal(svc);
          return;
        }
        // Admin has marked this service as needing a SCARLS consultation
        // before checkout — skip straight-to-Paystack entirely, even if
        // the price is a fixed figure, and route into the existing
        // assessment flow instead (Make an Offer → email link →
        // assessment.html).
        if (svc.requires_consultation) {
          openOfferModal(svc.name + (selectedPackage ? ' — ' + selectedPackage.name : ''));
          return;
        }
        var checkout = resolveCheckout_(svc);
        if (checkout) {
          openCheckoutModal(checkout);
        } else {
          // Range, "+", or custom pricing needs a human-scoped quote.
          openOfferModal(svc.name + (selectedPackage ? ' — ' + selectedPackage.name : ''));
        }
      });
    }
    var askBtn = document.getElementById('askAboutServiceBtn');
    if (askBtn) {
      askBtn.addEventListener('click', function () {
        closeServiceModal();
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function closeServiceModal() {
    serviceOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.getElementById('serviceModalClose').addEventListener('click', closeServiceModal);
  serviceOverlay.addEventListener('click', function (e) { if (e.target === serviceOverlay) closeServiceModal(); });

  /* ---------------- Make an Offer modal ---------------- */
  var offerOverlay = document.getElementById('offerModalOverlay');
  var offerForm = document.getElementById('offerForm');
  var offerSuccess = document.getElementById('offerFormSuccess');
  var offerSubmitBtn = document.getElementById('offerSubmitBtn');
  var offerFormError = document.getElementById('offerFormError');

  function openOfferModal(prefillServices) {
    offerForm.style.display = '';
    offerSuccess.classList.remove('is-visible');
    offerForm.reset();
    if (prefillServices) offerForm.servicesInterested.value = prefillServices;
    offerOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeOfferModal() {
    offerOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  document.getElementById('offerModalClose').addEventListener('click', closeOfferModal);
  offerOverlay.addEventListener('click', function (e) { if (e.target === offerOverlay) closeOfferModal(); });

  // Any element anywhere on the page (nav, hero, etc.) can trigger the
  // offer modal by adding data-open-offer-modal.
  document.querySelectorAll('[data-open-offer-modal]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); openOfferModal(); });
  });

  offerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!offerForm.checkValidity()) { offerForm.reportValidity(); return; }

    var payload = { action: 'offer' };
    Array.prototype.forEach.call(offerForm.elements, function (el) {
      if (el.name) payload[el.name] = (el.value || '').trim();
    });

    offerSubmitBtn.disabled = true;
    offerSubmitBtn.textContent = 'Submitting…';
    if (offerFormError) offerFormError.classList.remove('is-visible');

    if (!SCARLS_FORM_ENDPOINT || SCARLS_FORM_ENDPOINT.indexOf('PASTE_YOUR') === 0) {
      console.warn('SCARLS_FORM_ENDPOINT is not configured yet.');
      showOfferSuccess();
      return;
    }

    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) { showOfferSuccess(); }
        else { showOfferError(data && data.error ? data.error : 'Something went wrong. Please try again.'); }
      })
      .catch(function () { showOfferError('Could not reach the server. Please check your connection and try again.'); });
  });

  function showOfferSuccess() {
    offerForm.style.display = 'none';
    offerSuccess.classList.add('is-visible');
  }
  function showOfferError(message) {
    offerSubmitBtn.disabled = false;
    offerSubmitBtn.textContent = 'Submit Project Request';
    if (offerFormError) { offerFormError.textContent = message; offerFormError.classList.add('is-visible'); }
  }

  /* ---------------- Checkout modal (Paystack) ---------------- */
  var checkoutOverlay = document.getElementById('checkoutModalOverlay');
  var checkoutForm = document.getElementById('checkoutForm');
  var checkoutSuccess = document.getElementById('checkoutFormSuccess');
  var checkoutPayBtn = document.getElementById('checkoutPayBtn');
  var checkoutFormError = document.getElementById('checkoutFormError');
  var checkoutSummaryEl = document.getElementById('checkoutSummary');
  var currentCheckout = null;

  function openCheckoutModal(checkout) {
    currentCheckout = checkout;
    checkoutForm.style.display = '';
    checkoutSuccess.classList.remove('is-visible');
    checkoutForm.reset();
    checkoutFormError.classList.remove('is-visible');
    checkoutPayBtn.disabled = false;
    checkoutPayBtn.textContent = 'Pay with Paystack';

    var label = checkout.serviceName + (checkout.packageName ? ' — ' + checkout.packageName : '');
    checkoutSummaryEl.innerHTML = '<span>' + escapeHtml(label) + '</span><span>' + escapeHtml(checkout.priceLabel) + '</span>';

    checkoutOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeCheckoutModal() {
    checkoutOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  document.getElementById('checkoutModalClose').addEventListener('click', closeCheckoutModal);
  checkoutOverlay.addEventListener('click', function (e) { if (e.target === checkoutOverlay) closeCheckoutModal(); });

  checkoutForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!checkoutForm.checkValidity()) { checkoutForm.reportValidity(); return; }
    if (!currentCheckout) return;

    if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.indexOf('PASTE_YOUR') !== -1) {
      showCheckoutError('Payments are not configured yet — the Paystack public key is missing.');
      return;
    }
    if (typeof PaystackPop === 'undefined') {
      showCheckoutError('Could not load the payment provider. Please check your connection and try again.');
      return;
    }

    var fullName = checkoutForm.fullName.value.trim();
    var email = checkoutForm.email.value.trim();
    var whatsapp = checkoutForm.whatsapp.value.trim();
    var businessName = checkoutForm.businessName.value.trim();
    var reference = 'scarls_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

    checkoutPayBtn.disabled = true;
    checkoutPayBtn.textContent = 'Opening Paystack…';
    checkoutFormError.classList.remove('is-visible');

    var popup = new PaystackPop();
    popup.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: Math.round(currentCheckout.amountNaira * 100),
      currency: 'NGN',
      ref: reference,
      metadata: {
        serviceId: currentCheckout.serviceId,
        packageId: currentCheckout.packageId || '',
        pricingModel: currentCheckout.pricingModel,
        fullName: fullName,
        whatsapp: whatsapp,
        businessName: businessName,
        budgetToken: currentCheckout.budgetToken || '',
        quoteToken: currentCheckout.quoteToken || '',
        custom_fields: [
          { display_name: 'Service', variable_name: 'service', value: currentCheckout.serviceName },
          { display_name: 'WhatsApp', variable_name: 'whatsapp', value: whatsapp }
        ]
      },
      onSuccess: function (transaction) {
        checkoutPayBtn.textContent = 'Verifying payment…';
        verifyPaymentOnServer_({
          reference: transaction.reference, serviceId: currentCheckout.serviceId,
          packageId: currentCheckout.packageId, pricingModel: currentCheckout.pricingModel,
          fullName: fullName, email: email, whatsapp: whatsapp, businessName: businessName,
          budgetToken: currentCheckout.budgetToken || '',
          quoteToken: currentCheckout.quoteToken || ''
        });
      },
      onCancel: function () {
        checkoutPayBtn.disabled = false;
        checkoutPayBtn.textContent = 'Pay with Paystack';
      }
    });
  });

  function verifyPaymentOnServer_(payload) {
    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: 'verifyPayment' }, payload))
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) {
          checkoutForm.style.display = 'none';
          checkoutSuccess.classList.add('is-visible');
        } else {
          showCheckoutError((data && data.error) ? data.error : 'Payment could not be verified. If you were charged, contact SCARLS with your payment reference: ' + payload.reference);
        }
      })
      .catch(function () {
        showCheckoutError('Payment succeeded but we could not reach the server to confirm it. Please contact SCARLS with your payment reference: ' + payload.reference);
      });
  }

  function showCheckoutError(message) {
    checkoutPayBtn.disabled = false;
    checkoutPayBtn.textContent = 'Pay with Paystack';
    checkoutFormError.textContent = message;
    checkoutFormError.classList.add('is-visible');
  }

  /* ---------------- Budget check chat modal (Phase 5) ---------------- */
  var budgetChatOverlay = document.getElementById('budgetChatModalOverlay');
  var budgetChatIntro = document.getElementById('budgetChatIntro');
  var budgetChatContactForm = document.getElementById('budgetChatContactForm');
  var budgetChatStartBtn = document.getElementById('budgetChatStartBtn');
  var budgetChatContactError = document.getElementById('budgetChatContactError');
  var budgetChatThread = document.getElementById('budgetChatThread');
  var budgetChatMessageForm = document.getElementById('budgetChatMessageForm');
  var budgetChatMessageInput = document.getElementById('budgetChatMessageInput');
  var budgetChatSendBtn = document.getElementById('budgetChatSendBtn');
  var budgetChatWaiting = document.getElementById('budgetChatWaiting');
  var budgetChatDone = document.getElementById('budgetChatDone');
  var budgetChatDoneTitle = document.getElementById('budgetChatDoneTitle');
  var budgetChatDoneMessage = document.getElementById('budgetChatDoneMessage');

  var budgetChatSvc = null;
  var budgetChatToken = null;
  var budgetChatPollTimer = null;

  function openBudgetChatModal(svc) {
    budgetChatSvc = svc;
    budgetChatToken = null;
    stopBudgetChatPoll();

    var minLabel = '₦' + (Number(svc.min_budget) || 0).toLocaleString() + '/' + (svc.min_budget_period || 'daily');
    budgetChatIntro.textContent = 'Before checkout, we need to confirm your ' + minLabel + ' minimum budget for ' + svc.name + '. This takes under a minute — SCARLS\' own price for this service is fixed and won\'t change.';

    budgetChatContactForm.style.display = '';
    budgetChatContactForm.reset();
    budgetChatContactError.classList.remove('is-visible');
    budgetChatStartBtn.disabled = false;
    budgetChatStartBtn.textContent = 'Start Budget Check';
    budgetChatThread.style.display = 'none';
    budgetChatThread.innerHTML = '';
    budgetChatMessageForm.style.display = 'none';
    budgetChatWaiting.style.display = 'none';
    budgetChatDone.classList.remove('is-visible');

    budgetChatOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeBudgetChatModal() {
    budgetChatOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
    stopBudgetChatPoll();
  }
  document.getElementById('budgetChatModalClose').addEventListener('click', closeBudgetChatModal);
  budgetChatOverlay.addEventListener('click', function (e) { if (e.target === budgetChatOverlay) closeBudgetChatModal(); });
  document.getElementById('budgetChatCloseBtn').addEventListener('click', closeBudgetChatModal);

  function appendBudgetChatMessage(role, text) {
    var el = document.createElement('div');
    el.className = 'budget-chat-msg ' + (role === 'user' ? 'user' : 'model');
    el.textContent = text;
    budgetChatThread.appendChild(el);
    budgetChatThread.scrollTop = budgetChatThread.scrollHeight;
  }

  budgetChatContactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!budgetChatSvc) return;

    // A retry after a failed start reuses the token the server already
    // created, instead of submitting the contact form again and
    // creating a second row.
    if (budgetChatToken) {
      budgetChatStartBtn.disabled = true;
      budgetChatStartBtn.textContent = 'Retrying…';
      budgetChatContactError.classList.remove('is-visible');
      retryBudgetChatTurn_();
      return;
    }

    if (!budgetChatContactForm.checkValidity()) { budgetChatContactForm.reportValidity(); return; }

    budgetChatStartBtn.disabled = true;
    budgetChatStartBtn.textContent = 'Starting…';
    budgetChatContactError.classList.remove('is-visible');

    var payload = {
      action: 'budgetChatStart',
      serviceId: budgetChatSvc.id,
      fullName: budgetChatContactForm.fullName.value.trim(),
      email: budgetChatContactForm.email.value.trim(),
      whatsapp: budgetChatContactForm.whatsapp.value.trim()
    };

    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) { handleBudgetChatStartResult_(data); })
      .catch(function () {
        budgetChatStartBtn.disabled = false;
        budgetChatStartBtn.textContent = 'Start Budget Check';
        budgetChatContactError.textContent = 'Could not reach the server. Please check your connection and try again.';
        budgetChatContactError.classList.add('is-visible');
      });
  });

  function handleBudgetChatStartResult_(data) {
    if (!data || !data.ok) {
      budgetChatStartBtn.disabled = false;
      budgetChatStartBtn.textContent = data && data.token ? 'Try Again' : 'Start Budget Check';
      // A retryable failure still hands back the token the server
      // already created — keep it so the next tap resumes in place
      // instead of starting over.
      budgetChatToken = (data && data.token) ? data.token : (data && data.retryable ? budgetChatToken : null);
      budgetChatContactError.textContent = (data && data.error) ? data.error : 'Could not start the budget check. Please try again.';
      budgetChatContactError.classList.add('is-visible');
      return;
    }
    budgetChatToken = data.token || budgetChatToken;
    budgetChatContactForm.style.display = 'none';
    budgetChatThread.style.display = '';
    if (data.reply) appendBudgetChatMessage('model', data.reply);
    handleBudgetChatTurn_(data);
  }

  function retryBudgetChatTurn_() {
    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'budgetChatMessage', token: budgetChatToken, message: '' })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) { handleBudgetChatStartResult_(data); })
      .catch(function () {
        budgetChatStartBtn.disabled = false;
        budgetChatStartBtn.textContent = 'Try Again';
        budgetChatContactError.textContent = 'Could not reach the server. Please check your connection and try again.';
        budgetChatContactError.classList.add('is-visible');
      });
  }

  budgetChatMessageForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var message = budgetChatMessageInput.value.trim();
    if (!message || !budgetChatToken) return;

    appendBudgetChatMessage('user', message);
    budgetChatMessageInput.value = '';
    budgetChatMessageInput.disabled = true;
    budgetChatSendBtn.disabled = true;

    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'budgetChatMessage', token: budgetChatToken, message: message })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        budgetChatMessageInput.disabled = false;
        budgetChatSendBtn.disabled = false;
        budgetChatMessageInput.focus();
        if (!data || !data.ok) {
          appendBudgetChatMessage('model', (data && data.error) ? data.error : 'Sorry, something went wrong — please try again.');
          return;
        }
        if (data.reply) appendBudgetChatMessage('model', data.reply);
        handleBudgetChatTurn_(data);
      })
      .catch(function () {
        budgetChatMessageInput.disabled = false;
        budgetChatSendBtn.disabled = false;
        appendBudgetChatMessage('model', 'Network error — please try again.');
      });
  });

  // Shared by both the start and message responses — decides what to
  // show next based on {status, done}.
  function handleBudgetChatTurn_(data) {
    if (!data.done) {
      budgetChatMessageForm.style.display = '';
      budgetChatMessageInput.focus();
      return;
    }

    budgetChatMessageForm.style.display = 'none';

    if (data.status === 'below_minimum') {
      showBudgetChatDone_('Below the required minimum', 'This service needs a bit more budget behind it to work well — feel free to explore other services, or reach out and we can suggest a better fit.');
      return;
    }

    if (data.status === 'approved' && data.checkout) {
      stopBudgetChatPoll();
      closeBudgetChatModal();
      openCheckoutModal({
        serviceId: data.checkout.serviceId, packageId: null, pricingModel: 'one_time',
        amountNaira: data.checkout.amountNaira, priceLabel: data.checkout.priceLabel,
        serviceName: data.checkout.serviceName, packageName: '',
        budgetToken: data.checkout.budgetToken
      });
      return;
    }

    if (data.status === 'awaiting_admin') {
      budgetChatWaiting.style.display = '';
      startBudgetChatPoll();
      return;
    }
  }

  function showBudgetChatDone_(title, message) {
    stopBudgetChatPoll();
    budgetChatThread.style.display = 'none';
    budgetChatWaiting.style.display = 'none';
    budgetChatDoneTitle.textContent = title;
    budgetChatDoneMessage.textContent = message;
    budgetChatDone.style.display = '';
    budgetChatDone.classList.add('is-visible');
  }

  function startBudgetChatPoll() {
    stopBudgetChatPoll();
    budgetChatPollTimer = setInterval(function () {
      if (!budgetChatToken) return;
      fetch(SCARLS_FORM_ENDPOINT + '?action=budgetChatStatus&token=' + encodeURIComponent(budgetChatToken))
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.ok) return;
          if (data.status === 'approved' && data.checkout) {
            stopBudgetChatPoll();
            closeBudgetChatModal();
            openCheckoutModal({
              serviceId: data.checkout.serviceId, packageId: null, pricingModel: 'one_time',
              amountNaira: data.checkout.amountNaira, priceLabel: data.checkout.priceLabel,
              serviceName: data.checkout.serviceName, packageName: '',
              budgetToken: data.checkout.budgetToken
            });
          } else if (data.status === 'rejected') {
            showBudgetChatDone_('Not approved this time', 'The SCARLS team wasn\'t able to approve this budget for this service. Reach out and we can suggest a better fit, or explore other services in the catalog.');
          }
        })
        .catch(function () { /* keep polling silently — a transient network blip shouldn't stop the check */ });
    }, 5000);
  }

  function stopBudgetChatPoll() {
    if (budgetChatPollTimer) { clearInterval(budgetChatPollTimer); budgetChatPollTimer = null; }
  }

  /* ---------------- AI ad-budget quote chat modal (Phase 6) ---------------- */
  var aiQuoteOverlay = document.getElementById('aiQuoteModalOverlay');
  var aiQuoteIntro = document.getElementById('aiQuoteIntro');
  var aiQuoteContactForm = document.getElementById('aiQuoteContactForm');
  var aiQuoteStartBtn = document.getElementById('aiQuoteStartBtn');
  var aiQuoteContactError = document.getElementById('aiQuoteContactError');
  var aiQuoteThread = document.getElementById('aiQuoteThread');
  var aiQuoteMessageForm = document.getElementById('aiQuoteMessageForm');
  var aiQuoteMessageInput = document.getElementById('aiQuoteMessageInput');
  var aiQuoteSendBtn = document.getElementById('aiQuoteSendBtn');
  var aiQuoteWaiting = document.getElementById('aiQuoteWaiting');
  var aiQuoteDone = document.getElementById('aiQuoteDone');
  var aiQuoteDoneTitle = document.getElementById('aiQuoteDoneTitle');
  var aiQuoteDoneMessage = document.getElementById('aiQuoteDoneMessage');

  var aiQuoteSvc = null;
  var aiQuoteToken = null;
  var aiQuotePollTimer = null;

  function openAiQuoteModal(svc) {
    aiQuoteSvc = svc;
    aiQuoteToken = null;
    stopAiQuotePoll();

    aiQuoteIntro.textContent = 'Tell me your ad budget and how many days you want to run ' + svc.name + ', and I\'ll put together a total for you to confirm before checkout.';

    aiQuoteContactForm.style.display = '';
    aiQuoteContactForm.reset();
    aiQuoteContactError.classList.remove('is-visible');
    aiQuoteStartBtn.disabled = false;
    aiQuoteStartBtn.textContent = 'Start';
    aiQuoteThread.style.display = 'none';
    aiQuoteThread.innerHTML = '';
    aiQuoteMessageForm.style.display = 'none';
    aiQuoteWaiting.style.display = 'none';
    aiQuoteDone.style.display = 'none';
    aiQuoteDone.classList.remove('is-visible');

    aiQuoteOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeAiQuoteModal() {
    aiQuoteOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
    stopAiQuotePoll();
  }
  document.getElementById('aiQuoteModalClose').addEventListener('click', closeAiQuoteModal);
  aiQuoteOverlay.addEventListener('click', function (e) { if (e.target === aiQuoteOverlay) closeAiQuoteModal(); });
  document.getElementById('aiQuoteCloseBtn').addEventListener('click', closeAiQuoteModal);

  function appendAiQuoteMessage(role, text) {
    var el = document.createElement('div');
    el.className = 'budget-chat-msg ' + (role === 'user' ? 'user' : 'model');
    el.textContent = text;
    aiQuoteThread.appendChild(el);
    aiQuoteThread.scrollTop = aiQuoteThread.scrollHeight;
  }

  aiQuoteContactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!aiQuoteSvc) return;

    if (aiQuoteToken) {
      aiQuoteStartBtn.disabled = true;
      aiQuoteStartBtn.textContent = 'Retrying…';
      aiQuoteContactError.classList.remove('is-visible');
      retryAiQuoteTurn_();
      return;
    }

    if (!aiQuoteContactForm.checkValidity()) { aiQuoteContactForm.reportValidity(); return; }

    aiQuoteStartBtn.disabled = true;
    aiQuoteStartBtn.textContent = 'Starting…';
    aiQuoteContactError.classList.remove('is-visible');

    var payload = {
      action: 'aiQuoteStart',
      serviceId: aiQuoteSvc.id,
      fullName: aiQuoteContactForm.fullName.value.trim(),
      email: aiQuoteContactForm.email.value.trim(),
      whatsapp: aiQuoteContactForm.whatsapp.value.trim()
    };

    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) { handleAiQuoteStartResult_(data); })
      .catch(function () {
        aiQuoteStartBtn.disabled = false;
        aiQuoteStartBtn.textContent = 'Start';
        aiQuoteContactError.textContent = 'Could not reach the server. Please check your connection and try again.';
        aiQuoteContactError.classList.add('is-visible');
      });
  });

  function handleAiQuoteStartResult_(data) {
    if (!data || !data.ok) {
      aiQuoteStartBtn.disabled = false;
      aiQuoteStartBtn.textContent = data && data.token ? 'Try Again' : 'Start';
      aiQuoteToken = (data && data.token) ? data.token : (data && data.retryable ? aiQuoteToken : null);
      aiQuoteContactError.textContent = (data && data.error) ? data.error : 'Could not start — please try again.';
      aiQuoteContactError.classList.add('is-visible');
      return;
    }
    aiQuoteToken = data.token || aiQuoteToken;
    aiQuoteContactForm.style.display = 'none';
    aiQuoteThread.style.display = '';
    if (data.reply) appendAiQuoteMessage('model', data.reply);
    handleAiQuoteTurn_(data);
  }

  function retryAiQuoteTurn_() {
    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'aiQuoteMessage', token: aiQuoteToken, message: '' })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) { handleAiQuoteStartResult_(data); })
      .catch(function () {
        aiQuoteStartBtn.disabled = false;
        aiQuoteStartBtn.textContent = 'Try Again';
        aiQuoteContactError.textContent = 'Could not reach the server. Please check your connection and try again.';
        aiQuoteContactError.classList.add('is-visible');
      });
  }

  aiQuoteMessageForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var message = aiQuoteMessageInput.value.trim();
    if (!message || !aiQuoteToken) return;

    appendAiQuoteMessage('user', message);
    aiQuoteMessageInput.value = '';
    aiQuoteMessageInput.disabled = true;
    aiQuoteSendBtn.disabled = true;

    fetch(SCARLS_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'aiQuoteMessage', token: aiQuoteToken, message: message })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        aiQuoteMessageInput.disabled = false;
        aiQuoteSendBtn.disabled = false;
        aiQuoteMessageInput.focus();
        if (!data || !data.ok) {
          appendAiQuoteMessage('model', (data && data.error) ? data.error : 'Sorry, something went wrong — please try again.');
          return;
        }
        if (data.reply) appendAiQuoteMessage('model', data.reply);
        handleAiQuoteTurn_(data);
      })
      .catch(function () {
        aiQuoteMessageInput.disabled = false;
        aiQuoteSendBtn.disabled = false;
        appendAiQuoteMessage('model', 'Network error — please try again.');
      });
  });

  // Shared by both the start and message responses.
  function handleAiQuoteTurn_(data) {
    if (data.checkout) {
      // Simple, in-limits requests resolve immediately, in the same
      // response that confirmed them — no admin involved, no polling.
      stopAiQuotePoll();
      closeAiQuoteModal();
      openCheckoutModal({
        serviceId: data.checkout.serviceId, packageId: null, pricingModel: 'one_time',
        amountNaira: data.checkout.amountNaira, priceLabel: data.checkout.priceLabel,
        serviceName: data.checkout.serviceName, packageName: '',
        quoteToken: data.checkout.quoteToken
      });
      return;
    }

    if (!data.done) {
      aiQuoteMessageForm.style.display = '';
      aiQuoteMessageInput.focus();
      return;
    }

    aiQuoteMessageForm.style.display = 'none';

    if (data.status === 'rejected') {
      showAiQuoteDone_('Not able to confirm this one', 'The SCARLS team wasn\'t able to approve this campaign as described. Reach out and we can suggest a better fit, or explore other services in the catalog.');
      return;
    }

    // Otherwise this went to admin review.
    aiQuoteWaiting.style.display = '';
    startAiQuotePoll();
  }

  function showAiQuoteDone_(title, message) {
    stopAiQuotePoll();
    aiQuoteThread.style.display = 'none';
    aiQuoteWaiting.style.display = 'none';
    aiQuoteDoneTitle.textContent = title;
    aiQuoteDoneMessage.textContent = message;
    aiQuoteDone.style.display = '';
    aiQuoteDone.classList.add('is-visible');
  }

  function startAiQuotePoll() {
    stopAiQuotePoll();
    aiQuotePollTimer = setInterval(function () {
      if (!aiQuoteToken) return;
      fetch(SCARLS_FORM_ENDPOINT + '?action=aiQuoteStatus&token=' + encodeURIComponent(aiQuoteToken))
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.ok) return;
          if (data.status === 'ready_for_checkout' && data.checkout) {
            stopAiQuotePoll();
            closeAiQuoteModal();
            openCheckoutModal({
              serviceId: data.checkout.serviceId, packageId: null, pricingModel: 'one_time',
              amountNaira: data.checkout.amountNaira, priceLabel: data.checkout.priceLabel,
              serviceName: data.checkout.serviceName, packageName: '',
              quoteToken: data.checkout.quoteToken
            });
          } else if (data.status === 'rejected') {
            showAiQuoteDone_('Not able to confirm this one', 'The SCARLS team wasn\'t able to approve this campaign as described. Reach out and we can suggest a better fit, or explore other services in the catalog.');
          }
        })
        .catch(function () { /* keep polling silently — a transient network blip shouldn't stop the check */ });
    }, 5000);
  }

  function stopAiQuotePoll() {
    if (aiQuotePollTimer) { clearInterval(aiQuotePollTimer); aiQuotePollTimer = null; }
  }

  // Escape key closes whichever modal is open
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeServiceModal(); closeOfferModal(); closeCheckoutModal(); closeBudgetChatModal(); closeAiQuoteModal(); }
  });

  /* ---------------- Resume from an emailed link ---------------- */
  // A client whose chat went to admin review gets emailed a link back
  // to this exact conversation (?budgetToken=... or ?aiQuoteToken=...)
  // instead of being stuck waiting on the original tab.
  function resumeFromUrl_() {
    var params = new URLSearchParams(window.location.search);
    var budgetTokenParam = params.get('budgetToken');
    var aiQuoteTokenParam = params.get('aiQuoteToken');
    if (!budgetTokenParam && !aiQuoteTokenParam) return;

    // Drop the token from the visible URL so refreshing or sharing the
    // link doesn't re-trigger this, and it isn't left sitting in the
    // address bar.
    var cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);

    if (budgetTokenParam) {
      fetch(SCARLS_FORM_ENDPOINT + '?action=budgetChatStatus&token=' + encodeURIComponent(budgetTokenParam))
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.ok) return;
          budgetChatSvc = { id: data.serviceId, name: data.serviceName };
          budgetChatToken = budgetTokenParam;
          budgetChatContactForm.style.display = 'none';
          budgetChatThread.style.display = '';
          budgetChatThread.innerHTML = '';
          (data.history || []).forEach(function (m) { appendBudgetChatMessage(m.role, m.text); });
          budgetChatDone.style.display = 'none';
          budgetChatDone.classList.remove('is-visible');
          budgetChatWaiting.style.display = 'none';
          budgetChatModalOverlay.classList.add('is-open');
          document.body.style.overflow = 'hidden';
          handleBudgetChatTurn_(data);
        })
        .catch(function () { /* link may be stale — just leave the catalog page showing */ });
    } else if (aiQuoteTokenParam) {
      fetch(SCARLS_FORM_ENDPOINT + '?action=aiQuoteStatus&token=' + encodeURIComponent(aiQuoteTokenParam))
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.ok) return;
          aiQuoteSvc = { id: data.serviceId, name: data.serviceName };
          aiQuoteToken = aiQuoteTokenParam;
          aiQuoteContactForm.style.display = 'none';
          aiQuoteThread.style.display = '';
          aiQuoteThread.innerHTML = '';
          (data.history || []).forEach(function (m) { appendAiQuoteMessage(m.role, m.text); });
          aiQuoteDone.style.display = 'none';
          aiQuoteDone.classList.remove('is-visible');
          aiQuoteWaiting.style.display = 'none';
          aiQuoteOverlay.classList.add('is-open');
          document.body.style.overflow = 'hidden';
          handleAiQuoteTurn_(data);
        })
        .catch(function () { /* link may be stale — just leave the catalog page showing */ });
    }
  }

  /* ---------------- Init ---------------- */
  renderTabs();
  renderGrid();
  fetchLiveCatalog();
  resumeFromUrl_();
})();
