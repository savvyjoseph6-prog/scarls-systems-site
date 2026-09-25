// Cloudflare Pages Function — file-based routing.
// This file's path (functions/p/[slug].js) makes it handle GET requests to
// scarlssystems.com/p/:slug automatically. No _redirects entry needed.
//
// What it does: fetches the pre-baked static HTML for this page from the
// public Supabase Storage bucket ("published-pages") and returns it
// directly. The URL in the visitor's browser stays scarlssystems.com/p/slug
// — they never see the Supabase URL. This is the actual rendering-cost fix:
// every visit hits Cloudflare's edge + a cheap Storage file fetch, never
// the Postgres database.

const SUPABASE_STORAGE_BASE =
  'https://zpytjifbhaxniuliopvp.supabase.co/storage/v1/object/public/published-pages';

export async function onRequestGet(context) {
  const { slug } = context.params;

  if (!slug || typeof slug !== 'string') {
    return new Response('Not found', { status: 404 });
  }

  const fileUrl = `${SUPABASE_STORAGE_BASE}/${encodeURIComponent(slug)}.html`;

  let upstream;
  try {
    upstream = await fetch(fileUrl);
  } catch (err) {
    return new Response('Failed to load page', { status: 502 });
  }

  if (!upstream.ok) {
    // No baked file yet for this slug — either it was never published,
    // or the slug doesn't exist. Either way, a plain 404.
    return new Response('Page not found', { status: 404 });
  }

  const html = await upstream.text();

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Short edge cache — republishing takes effect within a few minutes
      // rather than instantly, in exchange for not hitting Storage on
      // every single visit.
      'Cache-Control': 'public, max-age=300',
    },
  });
}