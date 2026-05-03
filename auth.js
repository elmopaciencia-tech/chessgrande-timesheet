// Shared auth helpers for static HTML pages.
(function initAuthHelpers() {
  function getSupabaseClient() {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized. Load supabase-client.js first.");
    }
    return window.supabaseClient;
  }

  function getLoginUrl() {
    const current = window.location.pathname.split("/").pop() + window.location.search;
    return `./login.html?next=${encodeURIComponent(current)}`;
  }

  function getProfileSetupUrl() {
    const current = window.location.pathname.split("/").pop() + window.location.search;
    return `./profile-setup.html?next=${encodeURIComponent(current)}`;
  }

  async function getCurrentUser() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Failed to get current user:", error.message);
      return null;
    }
    return data.user || null;
  }

  async function requireLogin() {
    const user = await getCurrentUser();
    if (user) return user;
    window.location.href = getLoginUrl();
    return null;
  }

  async function getCurrentProfile() {
    const user = await getCurrentUser();
    if (!user) return null;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to read profile:", error.message);
      return null;
    }
    return data || null;
  }

  function isProfileSetupComplete(profile) {
    if (!profile) return false;
    const requiredFields = [
      "full_name",
      "phone_number",
      "bank_account_number",
      "bank_name",
      "account_type",
    ];
    return requiredFields.every((key) => String(profile[key] || "").trim().length > 0);
  }

  function renderAccessDenied(roleLabel = "manager") {
    document.body.innerHTML = `
      <div style="padding:32px;font-family:Avenir Next,Segoe UI,sans-serif;color:#1d2a2a;">
        <h1 style="margin:0 0 8px;">Access denied</h1>
        <p style="margin:0 0 16px;">This page is available to ${roleLabel} accounts only.</p>
        <a href="./chess-timesheet.html" style="color:#245a52;text-decoration:underline;">Go to employee timesheet</a>
      </div>
    `;
  }

  async function requireManager() {
    const user = await requireLogin();
    if (!user) return null;
    const profile = await getCurrentProfile();
    if (profile && (profile.role === "manager" || profile.role === "webadmin")) {
      return user;
    }
    renderAccessDenied("manager or webadmin");
    return null;
  }

  async function requireWebAdmin() {
    const user = await requireLogin();
    if (!user) return null;
    const profile = await getCurrentProfile();
    if (profile && profile.role === "webadmin") {
      return user;
    }
    renderAccessDenied("webadmin");
    return null;
  }

  async function requireProfileSetup(options = {}) {
    const {
      enforceForRoles = ["employee"],
      redirectToSetup = true,
    } = options;

    if (window.location.pathname.endsWith("/profile-setup.html") || window.location.pathname.endsWith("profile-setup.html")) {
      return true;
    }

    const user = await requireLogin();
    if (!user) return false;
    const profile = await getCurrentProfile();
    const role = profile?.role || "employee";
    const shouldEnforce = enforceForRoles.includes(role);
    if (!shouldEnforce) return true;
    if (isProfileSetupComplete(profile)) return true;

    if (redirectToSetup) {
      window.location.href = getProfileSetupUrl();
    }
    return false;
  }

  async function logout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "./login.html";
  }

  window.getCurrentUser = getCurrentUser;
  window.getCurrentProfile = getCurrentProfile;
  window.requireLogin = requireLogin;
  window.requireManager = requireManager;
  window.requireWebAdmin = requireWebAdmin;
  window.isProfileSetupComplete = isProfileSetupComplete;
  window.requireProfileSetup = requireProfileSetup;
  window.logout = logout;
})();
