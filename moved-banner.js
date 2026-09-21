// moved-banner.js
// Shows a "we've moved to scarlssystems.com" popup, but ONLY when the site
// is being viewed on the old *.workers.dev link. On scarlssystems.com itself,
// this script does nothing.
//
// Include it near the end of <body> on every page of the OLD site, e.g.:
//   <script src="moved-banner.js"></script>

(function () {
  if (!window.location.hostname.endsWith(".workers.dev")) return;

  function init() {
    var overlay = document.createElement("div");
    overlay.id = "moved-overlay";
    overlay.style.cssText =
      "display:flex;position:fixed;inset:0;z-index:9999;" +
      "background:rgba(0,0,0,0.75);align-items:center;justify-content:center;" +
      "font-family:Arial,Helvetica,sans-serif;";

    overlay.innerHTML =
      '<div style="position:relative;width:100%;max-width:520px;margin:16px;' +
        'background:linear-gradient(135deg,#4d5bff,#8b5cf6);border-radius:20px;' +
        'padding:44px 36px 36px;text-align:center;color:#fff;' +
        'box-shadow:0 20px 60px rgba(0,0,0,0.4);">' +

        '<button id="moved-close" aria-label="Close" style="position:absolute;top:18px;right:18px;' +
          'width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.15);' +
          'border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;">&#10005;</button>' +

        '<span style="display:inline-block;padding:6px 16px;border-radius:20px;' +
          'background:rgba(255,255,255,0.18);font-size:12px;letter-spacing:0.12em;' +
          'font-weight:700;margin-bottom:20px;">WE\'VE MOVED</span>' +

        '<h2 style="margin:0 0 10px;font-size:30px;font-weight:800;line-height:1.2;">' +
          'New Home,<br>Same SCARLS.</h2>' +

        '<p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.9);">' +
          'This link is retiring. Our official site is now<br>' +
          '<strong>scarlssystems.com</strong> — please update your bookmarks.</p>' +

        '<a href="https://scarlssystems.com" id="moved-go" style="display:block;background:#fff;' +
          'color:#0b0c0e;text-decoration:none;font-weight:700;font-size:16px;padding:16px;' +
          'border-radius:12px;margin-bottom:14px;">Take me to scarlssystems.com</a>' +

        '<a href="#" id="moved-later" style="color:rgba(255,255,255,0.85);font-size:13px;' +
          'text-decoration:underline;">Maybe later</a>' +
      '</div>';

    document.body.appendChild(overlay);

    function dismiss() {
      overlay.style.display = "none";
    }

    document.getElementById("moved-close").addEventListener("click", dismiss);
    document.getElementById("moved-later").addEventListener("click", function (e) {
      e.preventDefault();
      dismiss();
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) dismiss();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();