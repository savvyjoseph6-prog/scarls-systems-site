// Minimal Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) using only WebCrypto.
// Same implementation the admin chat already uses (copied so this function is self-contained).
const enc = new TextEncoder();

export function b64uToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function bytesToB64u(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, len * 8));
}

// Encrypts `payload` for a subscription. `ephemeral` and `salt` are only injected by tests.
export async function encryptPayload(
  payload: Uint8Array, uaPublic: Uint8Array, authSecret: Uint8Array,
  ephemeral?: { publicKey: Uint8Array; privateJwk: JsonWebKey }, salt?: Uint8Array,
): Promise<Uint8Array> {
  let asPublic: Uint8Array, asPrivate: CryptoKey;
  if (ephemeral) {
    asPublic = ephemeral.publicKey;
    asPrivate = await crypto.subtle.importKey("jwk", ephemeral.privateJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  } else {
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
    asPrivate = kp.privateKey;
  }
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPrivate, 256));
  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdh, keyInfo, 32);
  const s = salt || crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(s, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(s, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const plain = concat(payload, new Uint8Array([2]));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, plain));
  const rs = new Uint8Array([0, 0, 0x10, 0]); // 4096
  return concat(s, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

async function vapidHeader(endpoint: string, publicB64u: string, privateD: string, subject: string): Promise<string> {
  const pub = b64uToBytes(publicB64u);
  const jwk = { kty: "EC", crv: "P-256", x: bytesToB64u(pub.slice(1, 33)), y: bytesToB64u(pub.slice(33, 65)), d: privateD };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const aud = new URL(endpoint).origin;
  const head = bytesToB64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = bytesToB64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + body)));
  return `vapid t=${head}.${body}.${bytesToB64u(sig)}, k=${publicB64u}`;
}

export interface PushSub { endpoint: string; p256dh: string; auth: string }

// Returns the HTTP status from the push service (201 = accepted, 404/410 = subscription is gone).
export async function sendWebPush(
  sub: PushSub, payload: unknown, vapid: { publicKey: string; privateKey: string; subject: string }, ttl = 86400,
): Promise<number> {
  const body = await encryptPayload(enc.encode(JSON.stringify(payload)), b64uToBytes(sub.p256dh), b64uToBytes(sub.auth));
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidHeader(sub.endpoint, vapid.publicKey, vapid.privateKey, vapid.subject),
      "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: String(ttl), Urgency: "high",
    },
    body,
  });
  try { await res.arrayBuffer(); } catch (_e) { /* ignore */ }
  return res.status;
}
