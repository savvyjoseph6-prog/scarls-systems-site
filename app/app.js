(function () {
  "use strict";
  var FN = "https://zpytjifbhaxniuliopvp.supabase.co/functions/v1";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXRqaWZiaGF4bml1bGlvcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTMyNjgsImV4cCI6MjEwMzg2OTI2OH0.QFGo9feUbsle_fGxNZvxMaBuRQzS55RKF2_i0oL0LYQ";
  var root = document.getElementById("app");
  var S = { session: ls("get", "scarls_session"), email: ls("get", "scarls_email"), projects: [], pid: null, data: null, ads: [], timer: null };
  var FLOW = ["paid", "brief", "in_progress", "review", "delivered"];
  var LABEL = { paid: "Payment received", brief: "Waiting for your details", in_progress: "In progress", review: "Ready for review", changes_requested: "Changes in progress", delivered: "Delivered", refunded: "Refunded" };

  function ls(op, k, v) { try { if (op === "get") return localStorage.getItem(k); if (op === "set") localStorage.setItem(k, v); if (op === "del") localStorage.removeItem(k); } catch (e) {} return null; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function $(id) { return document.getElementById(id); }
  function call(fn, body) {
    return fetch(FN + "/" + fn, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY, apikey: KEY }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  function api(body) { return call("app-api", body); }
  function when(v) { var d = new Date(v); return isNaN(d) ? "" : d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
  function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }

  /* ---------- sign in ---------- */
  function loginScreen(step, msg, isOk) {
    stopTimer();
    var email = S.email || "";
    root.innerHTML = '<div class="wrap"><div class="top"><div class="brand">SCARLS SYSTEMS</div></div><div class="card"><div class="bar"></div>' +
      (step === "code"
        ? '<h2>Enter your code</h2><p class="muted">We emailed a 6-digit code to <b>' + esc(email) + '</b>.</p><input id="code" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"><button class="btn" id="go">Sign in</button><button class="btn ghost" id="back">Use a different email</button>'
        : '<h2>Sign in</h2><p class="muted">Use the email you ordered with. We\'ll send you a code. No password needed.</p><input id="email" type="email" autocomplete="email" placeholder="you@example.com" value="' + esc(email) + '"><button class="btn" id="go">Send me a code</button>') +
      (msg ? '<p class="' + (isOk ? "ok" : "err") + '">' + esc(msg) + '</p>' : "") + '</div><p class="muted" style="text-align:center">New here? <a href="/services.html" style="color:#8b6cff">See our services</a></p></div>';
    var go = $("go");
    if (step === "code") {
      $("back").onclick = function () { loginScreen("email"); };
      go.onclick = function () {
        go.disabled = true;
        api({ action: "verify_code", email: email, code: $("code").value }).then(function (r) {
          if (!r.ok) { loginScreen("code", r.error); return; }
          S.session = r.session; S.email = r.email; S.projects = r.projects || [];
          ls("set", "scarls_session", r.session); ls("set", "scarls_email", r.email);
          route();
        }).catch(function () { loginScreen("code", "No connection. Try again."); });
      };
    } else {
      go.onclick = function () {
        email = ($("email").value || "").trim().toLowerCase(); S.email = email; go.disabled = true;
        api({ action: "request_code", email: email }).then(function (r) {
          if (!r.ok) { loginScreen("email", r.error); return; }
          loginScreen("code", "", true);
        }).catch(function () { loginScreen("email", "No connection. Try again."); });
      };
    }
  }

  function logout() {
    var t = S.session;
    if (t) api({ action: "logout", session: t });
    ls("del", "scarls_session"); S.session = null; S.projects = [];
    unsubscribePush().then(function () { loginScreen("email"); });
  }

  /* ---------- list ---------- */
  function loadList() {
    return api({ action: "list", session: S.session }).then(function (r) {
      if (r.expired) { ls("del", "scarls_session"); S.session = null; loginScreen("email", "Please sign in again."); return false; }
      if (r.ok) S.projects = r.projects; return true;
    });
  }

  function listScreen() {
    stopTimer(); S.pid = null;
    var h = '<div class="wrap"><div class="top"><div class="brand">SCARLS SYSTEMS</div><button class="link" id="out">Sign out</button></div><h2 style="margin:0 0 12px">Your projects</h2><div id="pushbox"></div>';
    if (!S.projects.length) h += '<div class="card muted">No projects yet.</div>';
    S.projects.forEach(function (p) {
      h += '<div class="card proj" data-id="' + esc(p.id) + '"><div class="row"><h3>' + esc(p.serviceName) + '</h3><span class="pill ' + esc(p.status) + '">' + esc(LABEL[p.status] || p.status) + '</span></div>' +
        '<p class="muted" style="margin:4px 0 0">' + esc([p.packageName, p.businessName].filter(Boolean).join(" · ")) + '</p>' + (p.last ? '<p class="last">' + (p.last.from === "customer" ? "You: " : "SCARLS: ") + esc(p.last.text) + '</p>' : "") + '</div>';
    });
    h += '<a class="btn ghost" href="/services.html" target="_blank" rel="noopener">Order again</a></div>';
    root.innerHTML = h;
    $("out").onclick = logout;
    [].forEach.call(root.querySelectorAll(".proj"), function (el) { el.onclick = function () { location.hash = "p=" + el.getAttribute("data-id"); }; });
    pushPrompt();
  }

  /* ---------- project ---------- */
  function projectScreen(id) {
    var p = S.projects.filter(function (x) { return x.id === id; })[0];
    if (!p) { location.hash = ""; return; }
    S.pid = id; S.data = null; S.ads = [];
    var idx = FLOW.indexOf(p.status); if (p.status === "changes_requested") idx = 3;
    root.innerHTML = '<div class="wrap"><div class="top"><button class="link back" id="bk">&larr; Projects</button><button class="link" id="out">Sign out</button></div>' +
      '<div class="card"><div class="bar"></div><h2>' + esc(p.serviceName) + '</h2><p class="muted" style="margin:2px 0 0">' + esc([p.packageName, p.businessName].filter(Boolean).join(" · ")) + '</p>' +
      '<div class="steps">' + FLOW.map(function (_, i) { return '<i class="' + (i <= idx ? "on" : "") + '"></i>'; }).join("") + '</div>' +
      '<div class="row"><b style="color:#f6f6f7">' + esc(LABEL[p.status] || p.status) + '</b>' + (p.dueDate ? '<span class="muted">Due ' + esc(new Date(p.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })) + '</span>' : "") + '</div>' +
      '<a class="btn ghost" target="_blank" rel="noopener" href="/status.html?t=' + encodeURIComponent(p.token) + '">Open full project page</a></div>' +
      '<div id="adsBox"></div><div class="card"><h3 style="margin-bottom:10px">Messages</h3><div class="msgs" id="msgs"><p class="muted">Loading…</p></div><form id="mf"><textarea id="mi" rows="2" maxlength="2000" placeholder="Write to the SCARLS team…"></textarea><button class="btn" id="ms">Send</button></form><p class="err" id="me"></p></div>' +
      '<a class="btn ghost" href="/services.html" target="_blank" rel="noopener">Order again</a></div>';
    $("bk").onclick = function () { location.hash = ""; }; $("out").onclick = logout;
    loadMessages(p); loadAds(p);
    $("mf").onsubmit = function (e) {
      e.preventDefault(); var t = $("mi").value.trim(); if (!t) return; $("ms").disabled = true; $("me").textContent = "";
      call("portal", { action: "send_message", token: p.token, body: t }).then(function (r) {
        $("ms").disabled = false;
        if (!r.ok) { $("me").textContent = r.error || "Could not send."; return; }
        $("mi").value = ""; drawMsgs(r.messages);
      }).catch(function () { $("ms").disabled = false; $("me").textContent = "No connection. Try again."; });
    };
    stopTimer(); S.timer = setInterval(function () { if (!document.hidden) loadMessages(p, true); }, 20000);
  }
  function drawMsgs(list) {
    var b = $("msgs"); if (!b) return;
    var near = b.scrollHeight - b.scrollTop - b.clientHeight < 80;
    b.innerHTML = list && list.length ? list.map(function (m) {
      var w = esc(when(m.at));
      if (m.kind === "approval") return '<div class="m event">You approved this project · ' + w + '</div>';
      if (m.kind === "system") return '<div class="m event">' + esc(m.text) + ' · ' + w + '</div>';
      if (m.from === "admin") return '<div class="m team"><small>SCARLS · ' + w + '</small>' + esc(m.text) + '</div>';
      return '<div class="m you"><small>You · ' + w + '</small>' + esc(m.text) + '</div>';
    }).join("") : '<p class="muted">No messages yet. Ask us anything.</p>';
    if (near || !b.dataset.d) { b.scrollTop = b.scrollHeight; b.dataset.d = 1; }
  }
  function loadMessages(p, quiet) {
    call("portal", { action: "messages", token: p.token }).then(function (r) { if (r.ok && S.pid === p.id) drawMsgs(r.messages); else if (!quiet && $("msgs")) $("msgs").innerHTML = '<p class="muted">Messages are unavailable right now.</p>'; }).catch(function () {});
  }
  function loadAds(p) {
    call("portal-ads", { token: p.token }).then(function (r) {
      var ads = r && r.ok && r.ads ? r.ads : []; var box = $("adsBox"); if (!box || !ads.length) return;
      box.innerHTML = '<div class="card"><h3 style="margin-bottom:10px">Your ads</h3>' + ads.map(function (a) {
        var h = '<div class="ad"><b style="color:#f6f6f7">' + esc(a.name) + '</b>';
        if (a.plannedDays && a.dayNumber) {
          var pct = a.finished ? 100 : Math.round(a.dayNumber / a.plannedDays * 100);
          h += '<p class="muted" style="margin:4px 0 0">' + (a.finished ? "Your ad run is complete (" + a.plannedDays + " of " + a.plannedDays + " days)" : "Day " + a.dayNumber + " of " + a.plannedDays) + '</p><div class="days"><div style="width:' + pct + '%"></div></div>';
        } else h += '<p class="muted" style="margin:4px 0 0">' + esc({ in_review: "In review", running: "Running", delivered: "Delivered" }[a.stage] || "") + '</p>';
        if (a.impressions > 0) h += '<div class="stats"><div><b>' + Number(a.reach).toLocaleString() + '</b><span>People reached</span></div><div><b>' + Number(a.clicks).toLocaleString() + '</b><span>Clicks</span></div><div><b>' + Number(a.results).toLocaleString() + '</b><span>' + esc(a.resultLabel || "Results") + '</span></div></div>';
        else if (a.stage === "in_review") h += '<p class="muted">Results show here once your ads are live.</p>';
        return h + '</div>';
      }).join("") + '</div>';
    }).catch(function () {});
  }

  /* ---------- push ---------- */
  function b64u(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var b = atob(s), o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }
  function pushSupported() { return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }
  function pushPrompt() {
    var box = $("pushbox"); if (!box || !pushSupported() || Notification.permission === "denied") return;
    navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
      if (sub) { if (S.session) subscribe(true); return; }
      if (!$("pushbox")) return;
      box.innerHTML = '<div class="card"><b style="color:#f6f6f7">Get notified</b><p class="muted" style="margin:4px 0 0">Know when we reply or your project moves forward.</p><button class="btn" id="pn">Turn on notifications</button></div>';
      $("pn").onclick = function () { subscribe(false); };
    }).catch(function () {});
  }
  function subscribe(silent) {
    return api({ action: "push_key" }).then(function (k) {
      if (!k.ok) return;
      return Notification.requestPermission().then(function (perm) {
        if (perm !== "granted") return;
        return navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription().then(function (s) { return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(k.key) }); });
        }).then(function (s) {
          return api({ action: "push_subscribe", session: S.session, subscription: s.toJSON(), ua: navigator.userAgent }).then(function () { var b = $("pushbox"); if (b && !silent) b.innerHTML = '<p class="ok">Notifications are on.</p>'; else if (b) b.innerHTML = ""; });
        });
      });
    }).catch(function () {});
  }
  function unsubscribePush() {
    if (!pushSupported()) return Promise.resolve();
    return navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (s) { if (s) { api({ action: "push_unsubscribe", session: S.session, endpoint: s.endpoint }); return s.unsubscribe(); } }).catch(function () {});
  }

  /* ---------- routing ---------- */
  function route() {
    if (!S.session) return loginScreen("email");
    var m = /p=([0-9a-f-]{36})/i.exec(location.hash);
    var go = function () { if (m) projectScreen(m[1]); else listScreen(); };
    if (S.projects.length) go(); else { root.innerHTML = '<div class="wrap"><p class="muted">Loading…</p></div>'; loadList().then(function (ok) { if (ok) go(); }); }
    if (S.projects.length) loadList().then(function (ok) { if (ok && !S.pid && !m) listScreen(); });
  }
  window.addEventListener("hashchange", route);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/app/sw.js", { scope: "/app/" }).catch(function () {});
    navigator.serviceWorker.addEventListener("message", function (e) { if (e.data && e.data.goto) { var m = /#(.*)$/.exec(e.data.goto); location.hash = m ? m[1] : ""; } });
  }
  route();
})();
