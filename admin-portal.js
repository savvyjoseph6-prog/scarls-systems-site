/* SCARLS admin add-on: client portal controls on the Projects tab.
 *
 * Adds to every project card:
 *   - the customer's brief status (Not started / Submitted / Approved ...)
 *   - "View brief": read their answers, open their files, then Approve (starts the
 *     project and emails them) or Ask for changes (emails them your note)
 *   - "Copy link" and "Resend email" for the customer's private project page
 *
 * Load it with one line at the bottom of admin.html, after the main script
 * (and after admin-announcement.js if you use it):
 *   <script src="admin-portal.js"></script>
 */
(function () {
  'use strict';

  var FN = "https://zpytjifbhaxniuliopvp.supabase.co/functions/v1";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXRqaWZiaGF4bml1bGlvcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTMyNjgsImV4cCI6MjEwMzg2OTI2OH0.QFGo9feUbsle_fGxNZvxMaBuRQzS55RKF2_i0oL0LYQ";

  var listEl = document.getElementById('projectList');
  if (!listEl) return;

  var BRIEF_LABELS = {
    none: 'Not started',
    draft: 'Started (draft)',
    submitted: 'Submitted — needs your review',
    changes_requested: 'Waiting for the customer',
    approved: 'Approved'
  };

  function getPassword() {
    try { return sessionStorage.getItem('scarls_admin_pw') || ''; } catch (e) { return ''; }
  }

  function post(body) {
    body.password = getPassword();
    return fetch(FN + '/admin-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON },
      body: JSON.stringify(body)
    }).then(function (res) { return res.json(); });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function fmtBytes(n) {
    if (!n) return '';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  /* ---------- Styles ---------- */
  var style = document.createElement('style');
  style.textContent =
    '.pp-block{border-top:1px solid var(--line-soft);margin:12px 0 4px;padding-top:12px;}' +
    '.pp-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px;font-size:12.5px;color:var(--silver);}' +
    '.pp-label{font-family:var(--font-mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--silver-dim);min-width:92px;}' +
    '.pp-badge{font-family:var(--font-mono);font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:4px 9px;border-radius:100px;border:1px solid var(--line);color:var(--silver);}' +
    '.pp-b-submitted{color:#ffd479;border-color:#4a3f22;}' +
    '.pp-b-approved{color:#7ee0a8;border-color:#22452f;}' +
    '.pp-b-changes_requested{color:#c98bff;border-color:#3a224a;}' +
    '.pp-btn{font-family:var(--font-mono);font-size:11px;padding:6px 12px;border-radius:7px;border:1px solid var(--line);background:transparent;color:var(--silver-bright);cursor:pointer;}' +
    '.pp-btn:hover{border-color:var(--silver-bright);}' +
    '.pp-btn[disabled]{opacity:.5;cursor:default;}' +
    '.pp-btn.primary{background:var(--white);color:var(--black);border-color:var(--white);}' +
    '.pp-btn.danger{color:#ff8b8b;border-color:#4a2222;}' +
    '.pp-msg{font-size:11.5px;min-height:14px;color:var(--silver-dim);}' +
    '.pp-msg.ok{color:#7ee0a8;}.pp-msg.err{color:#ff8b8b;}' +
    '.pp-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.7);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto;}' +
    '.pp-modal{width:100%;max-width:640px;margin:24px auto;background:var(--graphite-0);border:1px solid var(--line-soft);border-radius:14px;padding:20px 18px 22px;}' +
    '.pp-modal h2{font-family:var(--font-display);color:var(--white);font-size:18px;margin:0 0 4px;}' +
    '.pp-modal .pp-sub{font-size:12.5px;color:var(--silver-dim);margin:0 0 14px;line-height:1.6;}' +
    '.pp-modal dl{margin:0 0 14px;}' +
    '.pp-modal dt{font-family:var(--font-mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--silver-dim);margin-top:11px;}' +
    '.pp-modal dd{margin:3px 0 0;font-size:13.5px;color:var(--off-white);white-space:pre-wrap;}' +
    '.pp-modal dd.empty{color:var(--silver-dim);font-style:italic;}' +
    '.pp-files{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin:8px 0 14px;}' +
    '.pp-file{border:1px solid var(--line-soft);border-radius:9px;padding:8px;font-size:11.5px;color:var(--silver);word-break:break-all;}' +
    '.pp-file img{display:block;width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px;background:var(--graphite-1);}' +
    '.pp-file a{color:var(--silver-bright);}' +
    '.pp-note{border:1px solid #3a224a;background:rgba(201,139,255,.06);color:#c98bff;border-radius:9px;padding:10px 12px;font-size:12.5px;margin-bottom:14px;white-space:pre-wrap;}' +
    '.pp-modal textarea{width:100%;background:var(--graphite-1);border:1px solid var(--line);color:var(--white);padding:9px 11px;font-size:13.5px;font-family:inherit;border-radius:7px;min-height:70px;resize:vertical;}' +
    '.pp-modal textarea:focus{outline:none;border-color:var(--accent-blue);}' +
    '.pp-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}';
  document.head.appendChild(style);

  /* ---------- Data ---------- */
  var info = {};
  var overviewLoaded = false;
  var overviewLoading = false;
  var timer = null;

  function loadOverview(force) {
    if (overviewLoading || !getPassword()) return Promise.resolve();
    if (overviewLoaded && !force) return Promise.resolve();
    overviewLoading = true;
    return post({ action: 'overview' })
      .then(function (data) {
        overviewLoading = false;
        if (!data || !data.ok) return;
        info = {};
        (data.items || []).forEach(function (it) { info[it.projectId] = it; });
        overviewLoaded = true;
      })
      .catch(function () { overviewLoading = false; });
  }

  function decorate() {
    var missing = false;
    Array.prototype.forEach.call(listEl.querySelectorAll('.project-card[data-id]'), function (card) {
      if (card.querySelector('.pp-block')) return;
      var id = card.getAttribute('data-id');
      var it = info[id];
      if (!it) { missing = true; return; }
      card.insertBefore(buildBlock(id, it), card.querySelector('.project-card-actions') || null);
    });
    // A project created since the page loaded: refresh once, then decorate it.
    if (missing && overviewLoaded && !decorate.retried) {
      decorate.retried = true;
      loadOverview(true).then(function () { decorate(); decorate.retried = false; });
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () { loadOverview(false).then(decorate); }, 60);
  }

  new MutationObserver(schedule).observe(listEl, { childList: true });

  /* ---------- The block on each project card ---------- */
  function buildBlock(id, it) {
    var block = document.createElement('div');
    block.className = 'pp-block';

    var briefKey = it.briefStatus || 'none';
    var showBrief = it.briefStatus || it.projectStatus === 'brief' || it.filesCount > 0;
    var html = '';
    if (showBrief) {
      html += '<div class="pp-row"><span class="pp-label">Customer brief</span>' +
        '<span class="pp-badge pp-b-' + esc(briefKey) + '">' + esc(BRIEF_LABELS[briefKey] || briefKey) + '</span>' +
        (it.filesCount ? '<span>' + it.filesCount + ' file' + (it.filesCount === 1 ? '' : 's') + '</span>' : '') +
        '<button type="button" class="pp-btn primary" data-act="view">View brief</button></div>';
    }
    html += '<div class="pp-row"><span class="pp-label">Customer page</span>' +
      (it.portalUrl
        ? '<button type="button" class="pp-btn" data-act="copy">Copy link</button><button type="button" class="pp-btn" data-act="resend">Resend email</button>'
        : '<span>No private link yet (run the portal SQL)</span>') +
      '</div><div class="pp-msg"></div>';
    block.innerHTML = html;

    var msg = block.querySelector('.pp-msg');
    function say(text, kind) { msg.textContent = text; msg.className = 'pp-msg' + (kind ? ' ' + kind : ''); }

    var view = block.querySelector('[data-act="view"]');
    if (view) view.addEventListener('click', function () { openBrief(id); });

    var copy = block.querySelector('[data-act="copy"]');
    if (copy) copy.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(it.portalUrl).then(function () { say('Link copied.', 'ok'); }, function () { window.prompt('Copy this link:', it.portalUrl); });
      } else {
        window.prompt('Copy this link:', it.portalUrl);
      }
    });

    var resend = block.querySelector('[data-act="resend"]');
    if (resend) resend.addEventListener('click', function () {
      if (!window.confirm('Email the customer their project link now?')) return;
      resend.disabled = true; say('Sending…', '');
      post({ action: 'resend', projectId: id })
        .then(function (data) {
          resend.disabled = false;
          if (data && data.ok) say('Email sent to the customer.', 'ok'); else say((data && data.error) || 'Could not send.', 'err');
        })
        .catch(function () { resend.disabled = false; say('Network error — try again.', 'err'); });
    });

    return block;
  }

  /* ---------- "View brief" window ---------- */
  function openBrief(projectId) {
    var overlay = document.createElement('div');
    overlay.className = 'pp-overlay';
    overlay.innerHTML = '<div class="pp-modal"><p class="pp-sub">Loading…</p></div>';
    document.body.appendChild(overlay);
    var modal = overlay.firstChild;

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    post({ action: 'get_brief', projectId: projectId })
      .then(function (data) {
        if (!data || !data.ok) { modal.innerHTML = '<p class="pp-sub">' + esc((data && data.error) || 'Could not load the brief.') + '</p><div class="pp-actions"><button type="button" class="pp-btn" id="ppClose">Close</button></div>'; modal.querySelector('#ppClose').addEventListener('click', close); return; }
        render(data);
      })
      .catch(function () { modal.innerHTML = '<p class="pp-sub">Could not reach the server.</p><div class="pp-actions"><button type="button" class="pp-btn" id="ppClose">Close</button></div>'; modal.querySelector('#ppClose').addEventListener('click', close); });

    function render(data) {
      var p = data.project, b = data.brief;
      var html = '<h2>' + esc(p.fullName) + '</h2>' +
        '<p class="pp-sub">' + esc(p.serviceName || '') + (p.packageName ? ' — ' + esc(p.packageName) : '') + '<br>' +
        esc(p.email || '') + (p.whatsapp ? ' · ' + esc(p.whatsapp) : '') + '<br>' +
        'Brief: <b>' + esc(BRIEF_LABELS[b.status || 'none'] || b.status) + '</b></p>';

      if (b.status === 'changes_requested' && b.adminNote) {
        html += '<div class="pp-note"><b>Your last request to the customer:</b>\n' + esc(b.adminNote) + '</div>';
      }

      html += '<dl>';
      var any = false;
      (b.items || []).forEach(function (i) {
        html += '<dt>' + esc(i.label) + '</dt>' + (i.value ? '<dd>' + esc(i.value) + '</dd>' : '<dd class="empty">— not answered —</dd>');
        if (i.value) any = true;
      });
      if (b.extra) { html += '<dt>Anything else</dt><dd>' + esc(b.extra) + '</dd>'; any = true; }
      html += '</dl>';
      if (!any && !(data.files || []).length) html += '<p class="pp-sub">The customer hasn\'t sent anything yet.</p>';

      if ((data.files || []).length) {
        html += '<dl><dt>Files (' + data.files.length + ') — links stay valid for one hour</dt></dl><div class="pp-files">';
        data.files.forEach(function (f) {
          var isImg = /^image\//.test(f.type) && f.url;
          html += '<div class="pp-file">' +
            (isImg ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener"><img src="' + esc(f.url) + '" alt=""></a>' : '') +
            (f.url ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.name) + '</a>' : esc(f.name)) +
            '<br>' + esc(fmtBytes(f.size)) + '</div>';
        });
        html += '</div>';
      }

      var canDecide = p.status === 'brief';
      if (canDecide) {
        html += '<dl><dt>Message to the customer</dt></dl>' +
          '<textarea id="ppNote" placeholder="Needed when you ask for changes (e.g. \'Please send your logo as a PNG and your prices\'). Optional when you approve."></textarea>' +
          '<div class="pp-actions">' +
          '<button type="button" class="pp-btn primary" id="ppApprove">Approve &amp; start project</button>' +
          '<button type="button" class="pp-btn danger" id="ppChanges">Ask for changes</button>' +
          '<button type="button" class="pp-btn" id="ppClose">Close</button></div>';
      } else {
        html += '<p class="pp-sub">This project is past the Brief stage, so there is nothing to approve.</p>' +
          '<div class="pp-actions"><button type="button" class="pp-btn" id="ppClose">Close</button></div>';
      }
      html += '<div class="pp-msg" id="ppMsg" style="margin-top:10px;"></div>';
      modal.innerHTML = html;

      modal.querySelector('#ppClose').addEventListener('click', close);
      if (!canDecide) return;

      var msg = modal.querySelector('#ppMsg');
      function say(text, kind) { msg.textContent = text; msg.className = 'pp-msg' + (kind ? ' ' + kind : ''); }
      function busy(on) { ['ppApprove', 'ppChanges'].forEach(function (id) { modal.querySelector('#' + id).disabled = on; }); }

      function decide(decision) {
        var note = modal.querySelector('#ppNote').value.trim();
        if (decision === 'changes' && note.length < 3) { say('Write what you need from the customer first.', 'err'); return; }
        if (decision === 'approve') {
          var sentence = b.status === 'submitted'
            ? 'Approve this brief and start the project? The customer will be emailed.'
            : 'The customer has NOT sent their brief yet. Start the project anyway? The customer will be emailed.';
          if (!window.confirm(sentence)) return;
        }
        busy(true); say('Saving…', '');
        post({ action: 'decide', decision: decision, projectId: projectId, note: note })
          .then(function (res) {
            if (!res || !res.ok) { busy(false); say((res && res.error) || 'Could not save.', 'err'); return; }
            say((decision === 'approve' ? 'Approved — the project has started. ' : 'Sent — the customer can now update their brief. ') +
              (res.emailed ? 'They have been emailed.' : 'The email could not be sent, so let them know yourself.'), res.emailed ? 'ok' : 'err');
            setTimeout(function () { window.location.reload(); }, 1400);
          })
          .catch(function () { busy(false); say('Network error — try again.', 'err'); });
      }
      modal.querySelector('#ppApprove').addEventListener('click', function () { decide('approve'); });
      modal.querySelector('#ppChanges').addEventListener('click', function () { decide('changes'); });
    }
  }

  // If the list is already on screen when this script loads, decorate it now.
  schedule();
})();