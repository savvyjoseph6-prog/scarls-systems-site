/* "Try the SCARLS app" nudge. Shows once in a while, never inside the app itself. */
(function () {
  try {
    if (/SCARLSApp/.test(navigator.userAgent)) return;
    var p = location.pathname;
    if (/get-app|\/app\/|admin|editor|renderer/.test(p)) return;
    var KEY = "scarls_app_nudge", until = 0;
    try { until = Number(localStorage.getItem(KEY)) || 0; } catch (e) {}
    if (until > Date.now()) return;
    var st = document.createElement("style");
    st.textContent = "#appNudge{position:fixed;left:12px;right:12px;bottom:12px;z-index:9998;max-width:440px;margin:0 auto;display:flex;gap:12px;align-items:center;background:#141518;border:1px solid #303338;border-radius:16px;padding:12px 14px;box-shadow:0 10px 40px rgba(0,0,0,.5);font:14px/1.4 Inter,system-ui,sans-serif;color:#d7d9dd;transform:translateY(140%);transition:transform .45s cubic-bezier(.2,1,.3,1)}#appNudge.in{transform:none}#appNudge img{width:44px;height:44px;border-radius:12px;flex:none}#appNudge b{display:block;color:#f6f6f7;font-size:14px}#appNudge span{color:#a6aab2;font-size:12.5px}#appNudge a.go{flex:none;background:linear-gradient(120deg,#4d7cff,#8b6cff);color:#fff;text-decoration:none;font-weight:600;border-radius:10px;padding:9px 13px;font-size:13px}#appNudge button{flex:none;background:none;border:0;color:#6b6f76;font-size:20px;line-height:1;cursor:pointer;padding:2px 4px}";
    document.head.appendChild(st);
    setTimeout(function () {
      var d = document.createElement("div");
      d.id = "appNudge";
      d.innerHTML = '<img src="/app/icons/icon-192.png" alt=""><div style="flex:1;min-width:0"><b>Try the SCARLS app</b><span>Track your projects and ads, chat with us, get updates.</span></div><a class="go" href="/get-app.html">Get it</a><button aria-label="Close">&times;</button>';
      document.body.appendChild(d);
      requestAnimationFrame(function () { d.classList.add("in"); });
      function hide(days) { d.classList.remove("in"); try { localStorage.setItem(KEY, String(Date.now() + days * 864e5)); } catch (e) {} setTimeout(function () { d.remove(); }, 500); }
      d.querySelector("button").onclick = function () { hide(14); };
      d.querySelector("a.go").onclick = function () { try { localStorage.setItem(KEY, String(Date.now() + 30 * 864e5)); } catch (e) {} };
    }, 3500);
  } catch (e) {}
})();
