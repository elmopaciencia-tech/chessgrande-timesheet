// Shared claim proof storage helpers (Cloudflare Worker + R2 private bucket).
(function initClaimProofStorage() {
  const CLAIM_PROOF_WORKER_URL = "https://claim-proof-worker.elmopaciencia.workers.dev";
  const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
  const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ]);

  const signedUrlCache = new Map();

  function hasWorkerUrl() {
    return CLAIM_PROOF_WORKER_URL && !CLAIM_PROOF_WORKER_URL.includes(CLAIM_PROOF_WORKER_URL_PLACEHOLDER);
  }

  function getWorkerBaseUrl() {
    return String(CLAIM_PROOF_WORKER_URL || "").replace(/\/+$/, "");
  }

  async function getAccessToken() {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized.");
    }
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) {
      throw new Error(`Could not read auth session: ${error.message || "unknown error"}`);
    }
    const token = data?.session?.access_token || "";
    if (!token) {
      throw new Error("Please log in again before uploading claim proofs.");
    }
    return token;
  }

  async function getCurrentUserSafe() {
    if (typeof window.getCurrentUser === "function") {
      return window.getCurrentUser();
    }
    const { data, error } = await window.supabaseClient.auth.getUser();
    if (error) {
      throw new Error(`Could not read current user: ${error.message || "unknown error"}`);
    }
    return data?.user || null;
  }

  function isR2ClaimKey(value) {
    return typeof value === "string" && value.startsWith("r2/");
  }

  function sanitizeFileName(name) {
    return String(name || "proof-image")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .replace(/^-+/, "")
      .slice(0, 120) || "proof-image";
  }

  function getExtensionFromType(mimeType) {
    const map = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/heic": "heic",
      "image/heif": "heif",
    };
    return map[mimeType] || "";
  }

  function buildClaimProofKey(userId, monthValue, file) {
    const normalizedMonth = /^\d{4}-\d{2}$/.test(monthValue || "") ? monthValue : "unknown-month";
    const safeName = sanitizeFileName(file?.name || "proof-image");
    const extFromType = getExtensionFromType(file?.type || "");
    const hasExt = /\.[a-zA-Z0-9]+$/.test(safeName);
    const finalName = hasExt || !extFromType ? safeName : `${safeName}.${extFromType}`;
    const randomPart = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    return `r2/${userId}/${normalizedMonth}/${Date.now()}-${randomPart}-${finalName}`;
  }

  function validateImageFile(file) {
    if (!file) {
      throw new Error("Please choose an image file first.");
    }
    const mimeType = String(file.type || "").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error("Only JPG, PNG, WEBP, GIF, HEIC, and HEIF files are allowed.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("Claim proof image is too large. Maximum size is 8 MB.");
    }
  }

  function maybeGetCachedSignedUrl(objectKey) {
    const cached = signedUrlCache.get(objectKey);
    if (!cached) return "";
    if (Date.now() >= cached.expiresAt) {
      signedUrlCache.delete(objectKey);
      return "";
    }
    return cached.url;
  }

  function cacheSignedUrl(objectKey, signedUrl, expiresInSeconds) {
    if (!objectKey || !signedUrl) return;
    const ttl = Math.max(15, Number(expiresInSeconds || 0));
    const expiresAt = Date.now() + ttl * 1000 - 5000;
    signedUrlCache.set(objectKey, { url: signedUrl, expiresAt });
  }

  async function postJson(url, body, token) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body || {}),
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const errorMessage = payload?.error || payload?.message || `Request failed (${response.status})`;
      throw new Error(errorMessage);
    }
    return payload || {};
  }

  async function uploadClaimProof(file, monthValue) {
    if (!hasWorkerUrl()) {
      throw new Error("Cloudflare Worker URL is not configured. Set CLAIM_PROOF_WORKER_URL in claim-proof-storage.js.");
    }
    validateImageFile(file);

    const user = await getCurrentUserSafe();
    if (!user) {
      throw new Error("Please log in before uploading a claim proof image.");
    }
    const token = await getAccessToken();
    const objectKey = buildClaimProofKey(user.id, monthValue, file);
    const workerBase = getWorkerBaseUrl();

    const uploadGrant = await postJson(
      `${workerBase}/api/claim-proofs/upload-token`,
      {
        objectKey,
        contentType: file.type || "application/octet-stream",
        sizeBytes: Number(file.size || 0),
      },
      token
    );

    const uploadUrl = uploadGrant?.uploadUrl || "";
    if (!uploadUrl) {
      throw new Error("Upload token response was missing uploadUrl.");
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      let uploadMessage = `Upload failed (${uploadResponse.status})`;
      try {
        const uploadPayload = await uploadResponse.json();
        uploadMessage = uploadPayload?.error || uploadPayload?.message || uploadMessage;
      } catch {
        // ignored on purpose
      }
      throw new Error(uploadMessage);
    }

    const resolvedKey = uploadGrant?.objectKey || objectKey;
    const signed = await signR2ObjectKey(resolvedKey, token, 60 * 60);
    return {
      path: resolvedKey,
      previewUrl: signed.signedUrl || "",
    };
  }

  async function signR2ObjectKey(objectKey, token, expiresInSeconds) {
    if (!hasWorkerUrl()) {
      throw new Error("Cloudflare Worker URL is not configured.");
    }
    const cachedUrl = maybeGetCachedSignedUrl(objectKey);
    if (cachedUrl) {
      return { signedUrl: cachedUrl, expiresIn: expiresInSeconds };
    }

    const workerBase = getWorkerBaseUrl();
    const payload = await postJson(
      `${workerBase}/api/claim-proofs/sign-read`,
      {
        objectKey,
        expiresIn: Number(expiresInSeconds || 3600),
      },
      token
    );

    const signedUrl = payload?.signedUrl || "";
    if (!signedUrl) {
      throw new Error("Sign-read response was missing signedUrl.");
    }
    cacheSignedUrl(objectKey, signedUrl, payload?.expiresIn || expiresInSeconds || 3600);
    return {
      signedUrl,
      expiresIn: payload?.expiresIn || expiresInSeconds || 3600,
    };
  }

  async function resolveClaimImageUrl(storedValue, options = {}) {
    const value = String(storedValue || "").trim();
    if (!value) return "";

    if (/^data:/i.test(value)) {
      return value;
    }
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    if (isR2ClaimKey(value)) {
      const token = await getAccessToken();
      const signed = await signR2ObjectKey(value, token, Number(options.expiresInSeconds || 60 * 60));
      return signed.signedUrl || "";
    }

    if (window.supabaseClient && options.fallbackSupabaseBucket) {
      const { data, error } = await window.supabaseClient.storage
        .from(options.fallbackSupabaseBucket)
        .createSignedUrl(value, Number(options.fallbackSupabaseSignedSeconds || 60 * 60));
      if (error) {
        console.warn("Legacy Supabase claim URL signing failed:", error.message);
        return "";
      }
      return data?.signedUrl || "";
    }

    return "";
  }

  window.claimProofStorage = {
    uploadClaimProof,
    resolveClaimImageUrl,
    isR2ClaimKey,
    buildClaimProofKey,
  };
})();
