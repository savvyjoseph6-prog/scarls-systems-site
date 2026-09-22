// SCARLS Landing Page Platform — shared Supabase client + auth helpers
//
// Include on every platform page, in this order:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="supabase-client.js"></script>

const SUPABASE_URL = 'https://zpytjifbhaxniuliopvp.supabase.co';
// This is the public anon key — safe to expose in client-side code.
// It only allows what the database's RLS policies permit.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXRqaWZiaGF4bml1bGlvcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTMyNjgsImV4cCI6MjEwMzg2OTI2OH0.QFGo9feUbsle_fGxNZvxMaBuRQzS55RKF2_i0oL0LYQ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Returns the logged-in user's profile row (id, role, full_name, email, etc.),
 * or null if nobody is logged in.
 */
async function getCurrentProfile() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return null;

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Failed to load profile:', error);
    return null;
  }
  return profile;
}

/**
 * Call at the top of a protected page.
 * - If nobody is logged in, redirects to login.html.
 * - If requiredRole is given and doesn't match, redirects to that
 *   role's own dashboard instead of showing an error.
 * Returns the profile if everything checks out.
 */
async function requireAuth(requiredRole) {
  const profile = await getCurrentProfile();

  if (!profile) {
    window.location.href = 'login.html';
    return null;
  }

  if (requiredRole && profile.role !== requiredRole) {
    window.location.href = profile.role === 'admin'
      ? 'admin-landing-pages.html'
      : 'student-dashboard.html';
    return null;
  }

  return profile;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}