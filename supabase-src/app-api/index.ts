import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { sendWebPush } from "./webpush.ts";

// Backend for the SCARLS customer app (https://scarlssystems.com/app/).
//  - Customers sign in with their email: we email a 6-digit code, they type it in. No passwords.
//  - A session (90 days) then lets the app list that customer's projects. Each project carries its own
//    private access code, which the app uses with the existing `portal` and `portal-ads` functions.
//  - Push notifications: the app registers a Web Push subscription; the database calls `notify` (with a
//    shared secret) when a message arrives or a project moves, and other functions can ask for a push too.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SITE_URL = (Deno.env.get("SITE_URL") || "https://scarlssystems.com").replace(/\/$/, "");
const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

function sb() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes: number): string {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sixDigits(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, "0");
}

function normEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase().slice(0, 200);
}
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);

function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string));
}

/* ---------------- email ---------------- */

async function sendMail(to: string, subject: string, text: string, html: string): Promise<void> {
  const smtpUser = (Deno.env.get("SMTP_USER") || "").trim();
  const smtpPassword = Deno.env.get("SMTP_PASSWORD") || "";
  if (!smtpUser || !smtpPassword) throw new Error("SMTP_USER / SMTP_PASSWORD are not set.");
  const smtpHost = (Deno.env.get("SMTP_HOST") || "mail.spacemail.com").trim();
  const smtpPort = Number((Deno.env.get("SMTP_PORT") || "465").trim());
  const from = (Deno.env.get("MAIL_FROM") || smtpUser).trim();
  const replyTo = (Deno.env.get("MAIL_REPLY_TO") || "").trim();
  const client = new SMTPClient({ connection: { hostname: smtpHost, port: smtpPort, tls: true, auth: { username: smtpUser, password: smtpPassword } } });
  try {
    const message: Record<string, unknown> = { from, to, subject: subject.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim(), content: text, html };
    if (replyTo) message.replyTo = replyTo;
    await client.send(message as any);
  } finally {
    try { await client.close(); } catch (_e) { /* ignore */ }
  }
}

function codeEmailHtml(code: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#050506;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050506;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
<tr><td style="padding:0 4px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:3px;color:#f6f6f7;">SCARLS SYSTEMS</td></tr>
<tr><td style="background:#141518;border:1px solid #303338;border-radius:16px;padding:32px 28px;font-family:Arial,Helvetica,sans-serif;color:#d7d9dd;font-size:16px;line-height:1.6;">
<div style="height:4px;width:56px;border-radius:4px;background:#4d7cff;background-image:linear-gradient(120deg,#4d7cff,#8b6cff);margin-bottom:22px;"></div>
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#f6f6f7;">Your sign-in code</h1>
<p style="margin:0 0 18px;">Type this code in the SCARLS app to sign in:</p>
<div style="background:#0b0c0e;border:1px solid #303338;border-radius:12px;padding:18px;text-align:center;font-size:34px;letter-spacing:10px;font-weight:700;color:#f6f6f7;">${esc(code)}</div>
<p style="margin:18px 0 0;color:#a6aab2;font-size:14px;">It works for 10 minutes. If you didn't ask for it, you can ignore this email; nobody can sign in without the code.</p>
</td></tr>
<tr><td style="padding:18px 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b6f76;">SCARLS SYSTEMS &middot; Built for Scale</td></tr>
</table></td></tr></table></body></html>`;
}

/* ---------------- sessions ---------------- */

async function sessionEmail(db: any, token: unknown): Promise<string | null> {
  const t = String(token ?? "");
  if (!/^[a-f0-9]{64}$/.test(t)) return null;
  const hash = await sha256Hex(t);
  const { data } = await db.from("app_sessions").select("email,expires_at").eq("token_hash", hash).maybeSingle();
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
  // Touch last_seen at most every few minutes.
  db.from("app_sessions").update({ last_seen: new Date().toISOString() }).eq("token_hash", hash).then(() => {}, () => {});
  return data.email as string;
}

async function listProjects(db: any, email: string) {
  const { data: projects } = await db.from("projects")
    .select("id,service_name,package_name,business_name,status,created_at,updated_at,due_date,access_token,archived_at,subscription_status,order_reference")
    .ilike("email", likeEscape(email)).is("archived_at", null).order("updated_at", { ascending: false }).limit(100);
  const rows = projects || [];
  const ids = rows.map((p: any) => p.id);
  const lastBy = new Map<string, any>();
  if (ids.length) {
    const { data: msgs } = await db.from("project_messages").select("project_id,sender,kind,body,created_at").in("project_id", ids).order("created_at", { ascending: false }).limit(400);
    for (const m of msgs || []) if (!lastBy.has(m.project_id)) lastBy.set(m.project_id, m);
  }
  return rows.map((p: any) => {
    const m = lastBy.get(p.id);
    return {
      id: p.id, token: p.access_token, serviceName: p.service_name || "Your project", packageName: p.package_name || "",
      businessName: p.business_name || "", status: p.status, createdAt: p.created_at, updatedAt: p.updated_at, dueDate: p.due_date || null,
      subscriptionStatus: p.subscription_status || null,
      last: m ? { from: m.sender, text: String(m.body || "").slice(0, 140), at: m.created_at } : null,
    };
  });
}

/* ---------------- push ---------------- */

let vapidCache: any = null;
async function vapid() {
  if (vapidCache) return vapidCache;
  const { data } = await sb().from("push_config").select("key,value");
  const m = new Map((data || []).map((r: any) => [r.key, r.value]));
  if (!m.get("vapid_public") || !m.get("vapid_private")) return null;
  vapidCache = { publicKey: m.get("vapid_public"), privateKey: m.get("vapid_private"), subject: SITE_URL };
  return vapidCache;
}

async function pushToEmail(db: any, email: string, payload: { title: string; body: string; url?: string; tag?: string }): Promise<number> {
  const keys = await vapid();
  if (!keys) return 0;
  const { data: subs } = await db.from("app_push_subscriptions").select("*").ilike("email", likeEscape(email));
  let sent = 0;
  await Promise.allSettled((subs || []).map(async (s: any) => {
    try {
      const status = await sendWebPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload, keys);
      if (status === 404 || status === 410) await db.from("app_push_subscriptions").delete().eq("endpoint", s.endpoint);
      else if (status >= 200 && status < 300) sent++;
    } catch (e) { console.error("push failed:", e); }
  }));
  return sent;
}

const STATUS_TEXT: Record<string, string> = {
  paid: "Payment received",
  brief: "We're waiting for your details",
  in_progress: "Work has started",
  review: "Ready for your review",
  changes_requested: "We're working on your changes",
  delivered: "Delivered",
};

async function handleNotify(db: any, b: any) {
  const { data: cfg } = await db.from("push_config").select("value").eq("key", "notify_secret").maybeSingle();
  if (!cfg || !cfg.value || String(b.secret || "") !== cfg.value) return { ok: false, error: "Not allowed." };

  if (b.type === "custom") {
    const email = normEmail(b.email);
    if (!validEmail(email)) return { ok: false, error: "Bad email." };
    const sent = await pushToEmail(db, email, { title: String(b.title || "SCARLS SYSTEMS").slice(0, 80), body: String(b.body || "").slice(0, 160), url: String(b.url || "/app/"), tag: String(b.tag || "scarls") });
    return { ok: true, sent };
  }

  const { data: p } = await db.from("projects").select("id,email,service_name,status").eq("id", String(b.project_id || "")).maybeSingle();
  if (!p || !p.email) return { ok: false, error: "No such project." };
  const url = "/app/#p=" + p.id;
  const name = p.service_name || "your project";

  if (b.type === "message") {
    const { data: last } = await db.from("project_messages").select("sender,kind,body").eq("project_id", p.id).order("created_at", { ascending: false }).limit(1);
    const m = last && last[0];
    if (!m || m.sender === "customer") return { ok: true, sent: 0 };
    const body = String(m.body || "").slice(0, 120) || "You have a new message.";
    return { ok: true, sent: await pushToEmail(db, normEmail(p.email), { title: "New message from SCARLS", body, url, tag: "msg-" + p.id }) };
  }
  if (b.type === "status") {
    const text = STATUS_TEXT[String(p.status)] || "Your project was updated";
    return { ok: true, sent: await pushToEmail(db, normEmail(p.email), { title: name, body: text, url, tag: "st-" + p.id }) };
  }
  return { ok: false, error: "Unknown type." };
}

/* ---------------- main ---------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const b = await req.json().catch(() => ({}));
    const db = sb();

    switch (b.action) {
      case "request_code": {
        const email = normEmail(b.email);
        const generic = { ok: true, message: "If that email has a project with us, a sign-in code is on its way." };
        if (!validEmail(email)) return json({ ok: false, error: "Please enter a valid email address." });

        const { count: projectCount } = await db.from("projects").select("id", { count: "exact", head: true }).ilike("email", likeEscape(email));
        if (!projectCount) return json(generic);

        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recent } = await db.from("app_login_codes").select("id", { count: "exact", head: true }).eq("email", email).gt("created_at", hourAgo);
        if ((recent || 0) >= MAX_CODES_PER_HOUR) return json({ ok: false, error: "Too many attempts. Please wait a little and try again." });

        const code = sixDigits();
        await db.from("app_login_codes").insert({ email, code_hash: await sha256Hex(email + ":" + code), expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString() });
        try {
          await sendMail(email, "Your SCARLS sign-in code", `Your SCARLS sign-in code is ${code}.\n\nIt works for 10 minutes. If you didn't ask for it, ignore this email.\n\n- SCARLS SYSTEMS`, codeEmailHtml(code));
        } catch (e) {
          console.error("code email failed:", e);
          return json({ ok: false, error: "We couldn't send the email right now. Please try again in a moment." });
        }
        return json(generic);
      }

      case "verify_code": {
        const email = normEmail(b.email);
        const code = String(b.code ?? "").replace(/\D/g, "").slice(0, 6);
        if (!validEmail(email) || code.length !== 6) return json({ ok: false, error: "Enter the 6-digit code from your email." });
        const { data: row } = await db.from("app_login_codes").select("*").eq("email", email).eq("used", false).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!row || new Date(row.expires_at).getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) {
          return json({ ok: false, error: "That code has expired. Please ask for a new one." });
        }
        if (row.code_hash !== await sha256Hex(email + ":" + code)) {
          await db.from("app_login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
          return json({ ok: false, error: "That code isn't right. Please check it and try again." });
        }
        await db.from("app_login_codes").update({ used: true }).eq("id", row.id);
        const token = randomHex(32);
        await db.from("app_sessions").insert({ token_hash: await sha256Hex(token), email, expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
        return json({ ok: true, session: token, email, projects: await listProjects(db, email) });
      }

      case "list": {
        const email = await sessionEmail(db, b.session);
        if (!email) return json({ ok: false, expired: true, error: "Please sign in again." });
        return json({ ok: true, email, projects: await listProjects(db, email) });
      }

      case "logout": {
        const t = String(b.session ?? "");
        if (/^[a-f0-9]{64}$/.test(t)) await db.from("app_sessions").delete().eq("token_hash", await sha256Hex(t));
        return json({ ok: true });
      }

      case "push_key": {
        const k = await vapid();
        return json({ ok: !!k, key: k ? k.publicKey : null });
      }

      case "push_subscribe": {
        const email = await sessionEmail(db, b.session);
        if (!email) return json({ ok: false, expired: true, error: "Please sign in again." });
        const s = b.subscription || {};
        const endpoint = String(s.endpoint || ""), p256dh = String(s.keys?.p256dh || ""), authKey = String(s.keys?.auth || "");
        if (!/^https:\/\//.test(endpoint) || !p256dh || !authKey) return json({ ok: false, error: "Bad subscription." });
        await db.from("app_push_subscriptions").upsert({ endpoint, email, p256dh, auth: authKey, user_agent: String(b.ua || "").slice(0, 200) }, { onConflict: "endpoint" });
        return json({ ok: true });
      }

      case "push_unsubscribe": {
        const email = await sessionEmail(db, b.session);
        if (!email) return json({ ok: true });
        await db.from("app_push_subscriptions").delete().eq("endpoint", String(b.endpoint || "")).ilike("email", likeEscape(email));
        return json({ ok: true });
      }

      case "notify":
        return json(await handleNotify(db, b));

      default:
        return json({ ok: false, error: "Unknown action." }, 400);
    }
  } catch (err) {
    console.error("app-api error:", err);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
});
