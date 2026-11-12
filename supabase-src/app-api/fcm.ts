// Sends a push to an Android phone through Firebase Cloud Messaging (HTTP v1).
// Needs the secret FIREBASE_SERVICE_ACCOUNT (the whole service-account JSON file).
let cached: { token: string; exp: number } | null = null;

function b64u(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function account(): { project_id: string; client_email: string; private_key: string } | null {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!raw) return null;
  try { const a = JSON.parse(raw); return a.project_id && a.client_email && a.private_key ? a : null; } catch (_e) { return null; }
}

export const fcmConfigured = () => !!account();

async function accessToken(a: { client_email: string; private_key: string }): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const pem = a.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64u(JSON.stringify({ iss: a.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head + "." + body)));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: head + "." + body + "." + b64u(sig) }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("FCM auth failed: " + JSON.stringify(j).slice(0, 200));
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cached.token;
}

// Returns the HTTP status (200 ok, 404 = this phone's token is no longer valid), or 0 if FCM isn't set up.
export async function sendFcm(token: string, payload: { title: string; body: string; url?: string; tag?: string }): Promise<number> {
  const a = account();
  if (!a) return 0;
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${a.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: "Bearer " + await accessToken(a), "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, data: { title: payload.title, body: payload.body, url: payload.url || "/app/", tag: payload.tag || "scarls" }, android: { priority: "HIGH" } } }),
  });
  const text = await res.text();
  if (!res.ok) console.error("fcm send failed", res.status, text.slice(0, 300));
  return res.status;
}
