// Shared Supabase browser client for the static payroll app.
// Keep this file client-safe: use the anon key only (never service role).
(function initSupabaseClient() {
  const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL_HERE";
  const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase CDN library not found. Make sure the CDN script loads before supabase-client.js.");
    return;
  }

  if (
    !SUPABASE_URL ||
    SUPABASE_URL === "PASTE_YOUR_SUPABASE_URL_HERE" ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY === "PASTE_YOUR_SUPABASE_ANON_KEY_HERE"
  ) {
    console.warn("Supabase is using placeholder credentials in supabase-client.js.");
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
