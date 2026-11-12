/* SCARLS customer app service worker: push notifications + offline shell */
var CACHE = "scarls-app-v2";
var SHELL = ["/app/", "/app/app.css", "/app/app.js", "/app/icons/icon-192.png"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {})); self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.indexOf("/app/") !== 0) return;
  e.respondWith(fetch(e.request).then(function (r) { var c = r.clone(); caches.open(CACHE).then(function (ch) { ch.put(e.request, c); }); return r; }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match("/app/"); }); }));
});
self.addEventListener("push", function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: "SCARLS SYSTEMS", body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(d.title || "SCARLS SYSTEMS", {
    body: d.body || "", tag: d.tag || "scarls", icon: "/app/icons/icon-192.png", badge: "/app/icons/icon-192.png", data: { url: d.url || "/app/" }, renotify: true
  }));
});
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/app/";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf("/app/") >= 0 && "focus" in list[i]) { list[i].postMessage({ goto: url }); return list[i].focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
