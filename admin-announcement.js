/* SCARLS admin add-on: "Announcement" tab.
 *
 * Adds an Announcement tab to admin.html (no other part of the page changes).
 * The banner's settings are saved with the existing admin-save-setting function
 * under the key "announcement", and read back with admin-get-setting.
 * Load it with one line at the bottom of admin.html, after the main script:
 *   <script src="admin-announcement.js"></script>
 */
(function () {
  'use strict';

  var SUPABASE_URL = "https://zpytjifbhaxniuliopvp.supabase.co";
  var FN = SUPABASE_URL + "/functions/v1";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXRqaWZiaGF4bml1bGlvcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTMyNjgsImV4cCI6MjEwMzg2OTI2OH0.QFGo9feUbsle_fGxNZvxMaBuRQzS55RKF2_i0oL0LYQ";
  var SETTING_KEY = 'announcement';

  var switchEl = document.getElementById('sectionSwitch');
  var wrap = document.getElementById('adminWrap');
  if (!switchEl || !wrap) return;

  function getPassword() {
    try { return sessionStorage.getItem('scarls_admin_pw') || ''; } catch (e) { return ''; }
  }

  function post(fnName, body) {
    return fetch(FN + '/' + fnName, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON },
      body: JSON.stringify(body)
    }).then(function (res) { return res.json(); });
  }

  /* ---------- Look of the preview (matches the banner on the website) ---------- */
  var style = document.createElement('style');
  style.textContent =
    '#an_preview{position:relative;padding:11px 16px;border-radius:8px;text-align:center;font-size:13.5px;font-weight:500;color:#fff;margin-top:6px;}' +
    '#an_preview.style-info{background:#1d2b53;}' +
    '#an_preview.style-success{background:#12513a;}' +
    '#an_preview.style-warning{background:#7a5200;}' +
    '#an_preview a{color:#fff;font-weight:700;text-decoration:underline;margin-left:8px;}' +
    '#an_preview .pv-cd{display:inline-block;margin-left:10px;padding:2px 10px;border-radius:100px;background:rgba(0,0,0,.25);font-family:var(--font-mono,monospace);font-size:12.5px;}' +
    '#announcementSection .an-hint{font-size:11.5px;color:var(--silver-dim);margin-top:5px;line-height:1.5;}';
  document.head.appendChild(style);

  /* ---------- Tab button + section ---------- */
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-section', 'announcement');
  btn.textContent = 'Announcement';
  switchEl.appendChild(btn);

  var section = document.createElement('div');
  section.id = 'announcementSection';
  section.style.display = 'none';
  section.innerHTML =
    '<div class="project-card">' +
      '<div class="field checks"><label><input type="checkbox" id="an_enabled"> Show the banner on the website</label></div>' +
      '<div class="field"><label>Message</label>' +
        '<textarea id="an_text" maxlength="300" placeholder="e.g. We have a new home! SCARLS SYSTEMS is now at yourdomain.com"></textarea></div>' +
      '<div class="field"><label>Link text (optional)</label><input id="an_linkText" type="text" maxlength="60" placeholder="e.g. Visit the new site"></div>' +
      '<div class="field"><label>Link address (optional)</label><input id="an_linkUrl" type="text" placeholder="https://yourdomain.com">' +
        '<p class="an-hint">Must start with https:// (or http://). Leave empty for a banner with no link.</p></div>' +
      '<div class="field"><label>Colour</label><select id="an_style">' +
        '<option value="info">Blue (information)</option>' +
        '<option value="success">Green (good news)</option>' +
        '<option value="warning">Amber (important notice)</option>' +
      '</select></div>' +
      '<div class="field"><label>Hide automatically on (optional)</label><input id="an_endsAt" type="datetime-local">' +
        '<p class="an-hint">Leave empty to keep showing it until you switch it off.</p></div>' +
      '<div class="field checks"><label><input type="checkbox" id="an_showCountdown"> Show a live countdown to that date in the banner</label></div>' +
      '<div class="field"><label>Show only on this website address (optional)</label>' +
        '<input id="an_onlyHost" type="text" placeholder="e.g. scarls-systems-site.savvyjoseph6.workers.dev">' +
        '<p class="an-hint">Useful when you move to your own domain: put your OLD address here and the banner will only appear there, telling visitors where you moved. Leave empty to show it on every address.</p></div>' +
      '<div class="field checks"><label><input type="checkbox" id="an_dismissible" checked> Visitors can close the banner</label></div>' +
      '<div class="field"><label>Preview</label><div id="an_preview" class="style-info"></div></div>' +
      '<div class="project-card-actions">' +
        '<button type="button" class="save-btn" id="an_saveBtn">Save banner</button>' +
        '<span class="save-status" id="an_status"></span>' +
      '</div>' +
    '</div>';
  wrap.appendChild(section);

  function el(id) { return document.getElementById(id); }

  /* ---------- Show / hide with the other tabs ---------- */
  Array.prototype.forEach.call(switchEl.querySelectorAll('button'), function (b) {
    if (b === btn) return;
    b.addEventListener('click', function () { section.style.display = 'none'; });
  });

  btn.addEventListener('click', function () {
    Array.prototype.forEach.call(switchEl.querySelectorAll('button'), function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    Array.prototype.forEach.call(wrap.children, function (child) {
      if (child.id && /Section$/.test(child.id)) child.style.display = 'none';
    });
    section.style.display = '';
    el('sectionTitle').textContent = 'Announcement Banner';
    el('projectCount').textContent = '';
    loadCurrent();
  });

  /* ---------- Preview ---------- */
  function formatLeft(iso) {
    var diff = new Date(iso).getTime() - Date.now();
    if (isNaN(diff) || diff <= 0) return '';
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var sec = Math.floor((diff % 60000) / 1000);
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return d > 0 ? d + 'd ' + h + 'h left' : pad(h) + ':' + pad(m) + ':' + pad(sec) + ' left';
  }

  function updatePreview() {
    var box = el('an_preview');
    box.className = 'style-' + el('an_style').value;
    box.textContent = el('an_text').value.trim() || 'Your message will appear here.';
    var endIso = localInputToIso(el('an_endsAt').value);
    if (el('an_showCountdown').checked && endIso) {
      var cd = document.createElement('span');
      cd.className = 'pv-cd';
      cd.textContent = formatLeft(endIso) || 'date has passed';
      box.appendChild(cd);
    }
    var linkText = el('an_linkText').value.trim();
    var linkUrl = el('an_linkUrl').value.trim();
    if (linkUrl) {
      var a = document.createElement('a');
      a.href = '#';
      a.textContent = linkText || 'Learn more';
      a.addEventListener('click', function (e) { e.preventDefault(); });
      box.appendChild(a);
    }
  }
  ['an_text', 'an_linkText', 'an_linkUrl', 'an_style', 'an_endsAt', 'an_showCountdown'].forEach(function (id) {
    el(id).addEventListener('input', updatePreview);
    el(id).addEventListener('change', updatePreview);
  });

  /* ---------- Helpers ---------- */
  function isoToLocalInput(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  function localInputToIso(value) {
    if (!value) return '';
    var d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  function cleanHost(value) {
    return String(value || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  }
  function validLink(u) {
    return /^https?:\/\//i.test(u) || /^\/(?!\/)/.test(u) || /^#/.test(u);
  }
  function setStatus(message, kind) {
    var s = el('an_status');
    s.textContent = message;
    s.className = 'save-status' + (kind ? ' ' + kind : '');
  }

  function fillForm(a) {
    a = a || {};
    el('an_enabled').checked = !!a.enabled;
    el('an_text').value = a.text || '';
    el('an_linkText').value = a.link_text || '';
    el('an_linkUrl').value = a.link_url || '';
    el('an_style').value = a.style || 'info';
    el('an_endsAt').value = isoToLocalInput(a.ends_at);
    el('an_showCountdown').checked = !!a.show_countdown;
    el('an_onlyHost').value = a.only_on_host || '';
    el('an_dismissible').checked = a.dismissible !== false;
    updatePreview();
  }

  /* ---------- Load ---------- */
  function loadCurrent() {
    var pw = getPassword();
    if (!pw) { setStatus('Please log in again.', 'err'); return; }
    setStatus('Loading…', '');
    post('admin-get-setting', { password: pw, key: SETTING_KEY })
      .then(function (data) {
        if (!data || !data.ok) { setStatus((data && data.error) || 'Could not load the banner.', 'err'); return; }
        var parsed = null;
        try { parsed = data.value ? JSON.parse(data.value) : null; } catch (e) { parsed = null; }
        fillForm(parsed);
        setStatus('', '');
      })
      .catch(function () { setStatus('Could not reach the server.', 'err'); });
  }

  /* ---------- Save ---------- */
  el('an_saveBtn').addEventListener('click', function () {
    var pw = getPassword();
    if (!pw) { setStatus('Please log in again.', 'err'); return; }

    var enabled = el('an_enabled').checked;
    var text = el('an_text').value.trim();
    var linkUrl = el('an_linkUrl').value.trim();
    var linkText = el('an_linkText').value.trim();

    if (enabled && !text) { setStatus('Write a message first, or untick "Show the banner".', 'err'); return; }
    if (linkUrl && !validLink(linkUrl)) { setStatus('The link must start with https://', 'err'); return; }
    if (linkUrl && !linkText) linkText = 'Learn more';

    var endsAtIso = localInputToIso(el('an_endsAt').value);
    var showCountdown = el('an_showCountdown').checked;
    if (showCountdown && !endsAtIso) { setStatus('Pick a hide date first, so there is a date to count down to.', 'err'); return; }
    if (endsAtIso && new Date(endsAtIso).getTime() <= Date.now() && enabled) { setStatus('That hide date has already passed — pick a date in the future.', 'err'); return; }

    var value = {
      enabled: enabled,
      text: text,
      link_text: linkUrl ? linkText : '',
      link_url: linkUrl,
      style: el('an_style').value,
      dismissible: el('an_dismissible').checked,
      ends_at: endsAtIso,
      show_countdown: showCountdown && !!endsAtIso,
      only_on_host: cleanHost(el('an_onlyHost').value),
      // A new version number makes visitors who closed an older message see this one.
      version: String(Date.now())
    };

    var saveBtn = el('an_saveBtn');
    saveBtn.disabled = true;
    setStatus('Saving…', '');
    post('admin-save-setting', { password: pw, key: SETTING_KEY, value: JSON.stringify(value) })
      .then(function (data) {
        saveBtn.disabled = false;
        if (data && data.ok) setStatus(enabled ? 'Saved — the banner is live.' : 'Saved — the banner is switched off.', 'ok');
        else setStatus((data && data.error) || 'Could not save.', 'err');
      })
      .catch(function () {
        saveBtn.disabled = false;
        setStatus('Network error — try again.', 'err');
      });
  });

  updatePreview();
})();