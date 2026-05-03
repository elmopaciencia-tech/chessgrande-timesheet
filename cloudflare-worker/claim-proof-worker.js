// Cloudflare Worker for private R2 claim proof uploads + signed reads.
// Deploy this worker separately from the static app.
//
// Required bindings / secrets:
// - CLAIM_PROOFS_BUCKET (R2 bucket binding)
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY
// - WORKER_UPLOAD_TOKEN_SECRET
// - PUBLIC_WORKER_BASE_URL (e.g. https://claim-proof.example.workers.dev)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
const MIN_READ_TTL = 60;
const MAX_READ_TTL = 60 * 60;
const WORKER_URL_PLACEHOLDER = "your-subdomain.workers.dev";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      const url = new URL(request.url);
      const { pathname } = url;

      if (request.method === "POST" && pathname === "/api/claim-proofs/upload-token") {
        return withCors(await handleUploadToken(request, env));
      }
      if (request.method === "PUT" && pathname === "/api/claim-proofs/upload") {
        return withCors(await handleUpload(request, env));
      }
      if (request.method === "POST" && pathname === "/api/claim-proofs/sign-read") {
        return withCors(await handleSignRead(request, env));
      }
      if (request.method === "GET" && pathname === "/api/claim-proofs/read") {
        return withCors(await handleRead(request, env));
      }

      return withCors(jsonResponse(404, { error: "Not found" }));
    } catch (error) {
      if (error instanceof ErrorResponse) {
        return withCors(jsonResponse(error.status, { error: error.message }));
      }
      return withCors(jsonResponse(500, { error: error?.message || "Unexpected worker error" }));
    }
  },
};

function withCors(response) {
  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    next.headers.set(key, value);
  }
  return next;
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function handleUploadToken(request, env) {
  const user = await requireAuthUser(request, env);
  const profile = await getProfileForUser(user.id, env);

  const body = await request.json().catch(() => ({}));
  const objectKey = String(body?.objectKey || "").trim();
  const contentType = String(body?.contentType || "application/octet-stream").trim();
  const sizeBytes = Number(body?.sizeBytes || 0);

  if (!objectKey) {
    return jsonResponse(400, { error: "objectKey is required." });
  }
  if (!objectKey.startsWith(`r2/${user.id}/`)) {
    return jsonResponse(403, { error: "You can only upload to your own claim-proof path." });
  }
  if (!sizeBytes || sizeBytes > MAX_UPLOAD_BYTES) {
    return jsonResponse(400, { error: "Invalid file size. Max upload size is 8 MB." });
  }

  if (!isRoleAllowed(profile?.role)) {
    return jsonResponse(403, { error: "Profile role is not allowed to upload claim proofs." });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  const tokenPayload = {
    type: "upload",
    sub: user.id,
    objectKey,
    contentType,
    sizeBytes,
    exp: expiresAt,
  };
  const token = await signToken(tokenPayload, env.WORKER_UPLOAD_TOKEN_SECRET);
  const baseUrl = resolvePublicWorkerBaseUrl(request, env);
  return jsonResponse(200, {
    objectKey,
    uploadUrl: `${baseUrl}/api/claim-proofs/upload?token=${encodeURIComponent(token)}`,
    expiresAt,
  });
}

async function handleUpload(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (!token) {
    return jsonResponse(401, { error: "Missing upload token." });
  }

  const payload = await verifyToken(token, env.WORKER_UPLOAD_TOKEN_SECRET);
  if (!payload || payload.type !== "upload") {
    return jsonResponse(401, { error: "Invalid upload token." });
  }
  if (Date.now() / 1000 >= Number(payload.exp || 0)) {
    return jsonResponse(401, { error: "Upload token expired." });
  }

  const body = await request.arrayBuffer();
  const contentLength = body.byteLength;
  if (!contentLength || contentLength > MAX_UPLOAD_BYTES) {
    return jsonResponse(400, { error: "Invalid upload body size." });
  }

  const expectedBytes = Number(payload.sizeBytes || 0);
  if (expectedBytes > 0 && expectedBytes !== contentLength) {
    return jsonResponse(400, { error: "Uploaded file size does not match granted size." });
  }

  await env.CLAIM_PROOFS_BUCKET.put(payload.objectKey, body, {
    httpMetadata: {
      contentType: payload.contentType || "application/octet-stream",
    },
  });

  return jsonResponse(200, { ok: true, objectKey: payload.objectKey });
}

async function handleSignRead(request, env) {
  const user = await requireAuthUser(request, env);
  const profile = await getProfileForUser(user.id, env);
  const body = await request.json().catch(() => ({}));
  const objectKey = String(body?.objectKey || "").trim();
  const requestedTtl = Number(body?.expiresIn || 0);

  if (!objectKey) {
    return jsonResponse(400, { error: "objectKey is required." });
  }
  if (!objectKey.startsWith("r2/")) {
    return jsonResponse(400, { error: "objectKey must start with r2/." });
  }

  const role = String(profile?.role || "employee").toLowerCase();
  const isManagerRole = role === "manager" || role === "webadmin";
  if (!isManagerRole && !objectKey.startsWith(`r2/${user.id}/`)) {
    return jsonResponse(403, { error: "You are not allowed to view this claim proof." });
  }

  const expiresIn = Math.max(MIN_READ_TTL, Math.min(MAX_READ_TTL, requestedTtl || 60 * 60));
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const tokenPayload = {
    type: "read",
    objectKey,
    exp: expiresAt,
  };
  const token = await signToken(tokenPayload, env.WORKER_UPLOAD_TOKEN_SECRET);
  const baseUrl = resolvePublicWorkerBaseUrl(request, env);
  return jsonResponse(200, {
    objectKey,
    signedUrl: `${baseUrl}/api/claim-proofs/read?token=${encodeURIComponent(token)}`,
    expiresIn,
    expiresAt,
  });
}

async function handleRead(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (!token) {
    return new Response("Missing token.", { status: 401 });
  }

  const payload = await verifyToken(token, env.WORKER_UPLOAD_TOKEN_SECRET);
  if (!payload || payload.type !== "read") {
    return new Response("Invalid token.", { status: 401 });
  }
  if (Date.now() / 1000 >= Number(payload.exp || 0)) {
    return new Response("Token expired.", { status: 401 });
  }

  const object = await env.CLAIM_PROOFS_BUCKET.get(payload.objectKey);
  if (!object) {
    return new Response("Not found.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=60");
  return new Response(object.body, {
    status: 200,
    headers,
  });
}

async function requireAuthUser(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = tokenMatch ? tokenMatch[1] : "";
  if (!token) {
    throw new ErrorResponse(401, "Missing Bearer token.");
  }

  const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!userResponse.ok) {
    throw new ErrorResponse(401, "Invalid or expired auth token.");
  }
  const user = await userResponse.json();
  if (!user?.id) {
    throw new ErrorResponse(401, "Could not resolve authenticated user.");
  }
  return user;
}

function isRoleAllowed(role) {
  return ["employee", "manager", "webadmin"].includes(String(role || "").toLowerCase());
}

function resolvePublicWorkerBaseUrl(request, env) {
  const configured = String(env.PUBLIC_WORKER_BASE_URL || "").trim();
  if (
    configured &&
    /^https?:\/\//i.test(configured) &&
    !configured.includes(WORKER_URL_PLACEHOLDER)
  ) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(request.url).origin.replace(/\/+$/, "");
}

async function getProfileForUser(userId, env) {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/profiles`);
  url.searchParams.set("select", "id,role");
  url.searchParams.set("id", `eq.${userId}`);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!response.ok) {
    throw new ErrorResponse(500, "Could not read profile role from Supabase.");
  }
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

class ErrorResponse extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function signToken(payload, secret) {
  if (!secret) {
    throw new Error("WORKER_UPLOAD_TOKEN_SECRET is missing.");
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacSha256(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

async function verifyToken(token, secret) {
  if (!secret) return null;
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  const expected = await hmacSha256(encodedPayload, secret);
  if (!timingSafeEqual(signature, expected)) {
    return null;
  }
  const parsed = JSON.parse(base64UrlDecode(encodedPayload));
  return parsed;
}

async function hmacSha256(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(a, b) {
  const strA = String(a || "");
  const strB = String(b || "");
  if (strA.length !== strB.length) return false;
  let result = 0;
  for (let i = 0; i < strA.length; i += 1) {
    result |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return result === 0;
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(value);
  return toBase64Url(bytes);
}

function base64UrlDecode(value) {
  const base64 = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const decoded = atob(padded);
  const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function toBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
