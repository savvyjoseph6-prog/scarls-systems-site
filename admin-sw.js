/* SCARLS admin service worker: chat push notifications */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: "New message", body: event.data ? event.data.text() : "" }; }
  var ua = self.navigator && self.navigator.userAgent || "";
  var ios = /iPad|iPhone|iPod/.test(ua);
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    var focused = list.filter(function (c) { return c.focused && c.visibilityState === "visible"; });
    if (focused.length && !ios) {
      focused.forEach(function (c) { c.postMessage({ type: "chat-ping", convId: data.convId }); });
      return;
    }
    return self.registration.showNotification(data.title || "SCARLS chat", {
      body: data.body || "",
      tag: data.tag || data.convId || "chat",
      renotify: true,
      icon: "assets/scarls-logo.png",
      badge: "assets/scarls-logo.png",
      data: { convId: data.convId, url: data.url || "/admin" },
    });
  }));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var d = event.notification.data || {};
  var url = d.url || "/admin";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf("/admin") !== -1 && "focus" in c) {
        c.postMessage({ type: "chat-open", convId: d.convId });
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});