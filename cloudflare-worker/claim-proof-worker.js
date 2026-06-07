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
// - OPENROUTER_API_KEY
// - RAG_DOCS_BUCKET (R2 bucket binding)

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenRouter } from "@langchain/openrouter";

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
const MAX_CHAT_MESSAGES = 12;
const MAX_CHAT_MESSAGE_CHARS = 1800;
const MAX_RAG_FILES = 40;
const MAX_RAG_FILE_CHARS = 24000;
const MAX_RAG_CONTEXT_CHARS = 9000;
const MAX_IMPORT_WORKBOOK_TEXT_CHARS = 52000;
const DEFAULT_RAG_DOCS_PREFIX = "rag-docs/";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4.1-mini";
const OPENROUTER_SETTINGS_KEY = "admin-settings/openrouter.json";

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
      if (request.method === "POST" && pathname === "/api/webadmin-chat") {
        return withCors(await handleWebadminChat(request, env));
      }
      if (request.method === "GET" && pathname === "/api/openrouter-settings") {
        return withCors(await handleGetOpenRouterSettings(request, env));
      }
      if (request.method === "POST" && pathname === "/api/openrouter-settings") {
        return withCors(await handleSaveOpenRouterSettings(request, env));
      }
      if (request.method === "POST" && pathname === "/api/timesheet-xlsx-parse") {
        return withCors(await handleTimesheetXlsxParse(request, env));
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

async function handleWebadminChat(request, env) {
  await requireWebadminProfile(request, env);
  if (!env.OPENROUTER_API_KEY) {
    throw new ErrorResponse(500, "OPENROUTER_API_KEY is not configured.");
  }

  const body = await request.json().catch(() => ({}));
  const messages = normalizeChatMessages(body?.messages, body?.message);
  const question = messages[messages.length - 1]?.content || "";
  if (!question) {
    throw new ErrorResponse(400, "Message is required.");
  }

  const retrieved = await retrieveRagDocuments(question, env);
  const context = formatRagContext(retrieved);
  const history = formatChatHistory(messages.slice(0, -1));
  const chain = await buildWebadminChatChain(env);
  const answer = await chain.invoke({
    question,
    history,
    context: context || "No private RAG documents matched this question.",
  });

  return jsonResponse(200, {
    answer,
    sources: retrieved.map((doc) => ({
      key: doc.key,
      title: doc.title,
      score: doc.score,
    })),
  });
}

async function handleGetOpenRouterSettings(request, env) {
  await requireWebadminProfile(request, env);
  const settings = await getOpenRouterSettings(env);
  return jsonResponse(200, formatOpenRouterSettingsResponse(settings, env));
}

async function handleSaveOpenRouterSettings(request, env) {
  await requireWebadminProfile(request, env);
  const body = await request.json().catch(() => ({}));
  const settings = {
    chatModel: normalizeOpenRouterModel(body?.chatModel, "chatModel"),
    importModel: normalizeOpenRouterModel(body?.importModel, "importModel"),
  };
  await saveOpenRouterSettings(env, settings);
  return jsonResponse(200, formatOpenRouterSettingsResponse(settings, env));
}

async function handleTimesheetXlsxParse(request, env) {
  const user = await requireAuthUser(request, env);
  const profile = await getProfileForUser(user.id, env);
  if (!isRoleAllowed(profile?.role)) {
    throw new ErrorResponse(403, "This import is available to employee, manager, and webadmin accounts only.");
  }
  if (!env.OPENROUTER_API_KEY) {
    throw new ErrorResponse(500, "OPENROUTER_API_KEY is not configured.");
  }

  const body = await request.json().catch(() => ({}));
  const fileName = String(body?.fileName || "uploaded.xlsx").trim();
  const selectedMonth = String(body?.selectedMonth || "").trim();
  const workbookText = String(body?.workbookText || "");

  if (!workbookText.trim()) {
    throw new ErrorResponse(400, "workbookText is required.");
  }
  if (workbookText.length > MAX_IMPORT_WORKBOOK_TEXT_CHARS) {
    throw new ErrorResponse(413, "workbookText is too large.");
  }

  const prompt = buildTimesheetXlsxImportPrompt({ fileName, selectedMonth, workbookText });
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Chess Grande Timesheet XLSX Import",
      ...(env.OPENROUTER_SITE_URL || env.PUBLIC_WORKER_BASE_URL
        ? { "HTTP-Referer": env.OPENROUTER_SITE_URL || env.PUBLIC_WORKER_BASE_URL }
        : {}),
    },
    body: JSON.stringify({
      model: await resolveOpenRouterImportModel(env),
      temperature: 0.05,
      max_tokens: 7000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ErrorResponse(response.status, `OpenRouter ${response.status}: ${text.slice(0, 260)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new ErrorResponse(502, "OpenRouter returned an empty response.");
  }

  return jsonResponse(200, { content });
}

function buildTimesheetXlsxImportPrompt({ fileName, workbookText, selectedMonth }) {
  return [
    "You are parsing a Chess Grande timesheet XLSX into draft timesheet entries.",
    "Return valid JSON only. Do not include markdown, prose, or comments.",
    "",
    "Top-level schema:",
    "{",
    '  "month": "YYYY-MM",',
    '  "entries": [],',
    '  "warnings": [],',
    '  "payCalculation": {',
    '    "standardRate": number,',
    '    "schoolHours": number,',
    '    "schoolPay": number,',
    '    "importableClaimTotal": number,',
    '    "importableTotal": number,',
    '    "warningClaimTotal": number,',
    '    "workbookClaimTotal": number,',
    '    "workbookGrandTotal": number',
    "  }",
    "}",
    "",
    "Every entry MUST include this exact full shape:",
    "{",
    '  "date": "YYYY-MM-DD",',
    '  "type": "School Coaching" | "Replacement" | "Claim" | "Camp" | "Private" | "Event",',
    '  "schoolName": string,',
    '  "startTime": "HH:MM" | "",',
    '  "endTime": "HH:MM" | "",',
    '  "hours": number,',
    '  "replacementName": string,',
    '  "customRate": number | null,',
    '  "claimNotes": string,',
    '  "claimCost": number | null,',
    '  "calendarColor": "#B4CFA4"',
    "}",
    "",
    "Parsing rules:",
    "- Use the INTERPRETED TIMESHEET ROWS section first; raw rows are backup evidence.",
    "- Do not invent missing dates, times, names, hours, or costs.",
    '- School/location rows become type "School Coaching" unless an explicit separate type section says otherwise.',
    "- If one row has multiple date cells, create one entry per date.",
    '- Convert times like 0930 to "09:30".',
    "- Convert Excel date serials and day/month cells to ISO dates for the selected month.",
    "- Convert day numbers in the selected month to ISO dates.",
    '- Never use a rate/pay, Total, Total Hours, or Total $ column as "hours".',
    "- Chess Grande templates vary. Use the column headers and INTERPRETED TIMESHEET ROWS instead of fixed assumptions.",
    "- In newer Private Lessons rows, column L is Rate/customRate and column M is No. of Hours. For example, if L=55 and M=1, set customRate 55 and hours 1.",
    "- In older Private Lessons rows, column M is Rate/customRate and column N is No. of Hours. For example, if M=60 and N=1, set customRate 60 and hours 1.",
    "- In interpreted rows, trust hours= for entry hours and rate= for customRate; do not swap them.",
    "- The duration from startTime to endTime must match hours.",
    "- If workbook end time conflicts with hours, calculate endTime from startTime + hours and add a warning.",
    '- Any interpreted row with WARNING=timeHoursMismatch must produce a warning with type "TimeHoursMismatch", sourceRow, reason, and the correction used.',
    "- Keep replacement-looking names as schoolName unless a separate replacement person is explicitly shown.",
    '- For non-claim coaching entries, set claimNotes "" and claimCost null.',
    '- For Claim entries, set schoolName "Claims", startTime "", endTime "", hours 0, replacementName "", customRate null.',
    "- Claim rows become executable entries only when item, amount, and date are present.",
    "- Claim rows with item and amount but no date MUST become Claim entries dated on the first day of the selected month.",
    "- Interpreted claim rows with dateDefaultedToMonthStart=true are valid executable Claim entries, not warnings.",
    "- Private Lessons rows must contribute to importableTotal using their rate column when present.",
    "- importableTotal must include every executable non-claim paid row plus executable claims.",
    "",
    "Warning schema:",
    "{",
    '  "sourceRow": number,',
    '  "type": string,',
    '  "reason": string,',
    '  "claimNotes": string,',
    '  "claimCost": number',
    "}",
    "",
    "Pay calculation rules:",
    "- standardRate comes from the workbook standard coaching rate.",
    "- schoolHours is the sum of all executable non-claim paid hours across Schools, CG Weekly, Private, Camp, and coaching rows.",
    "- schoolPay is the sum of pay for all executable non-claim paid rows; use row-specific Private/custom rates when present, otherwise use standardRate.",
    "- importableClaimTotal is the sum of executable claim costs.",
    "- importableTotal = schoolPay + importableClaimTotal.",
    "- warningClaimTotal is the sum of claim costs that were not executable because of warnings.",
    "- workbookClaimTotal is the claim total shown in the workbook, if present.",
    "- workbookGrandTotal is the final total shown in the workbook, if present.",
    "- payCalculation must never be empty. Use 0 only when a value truly cannot be found.",
    "",
    "Validation requirement:",
    "- every entry has all required keys;",
    '- every Claim entry has schoolName "Claims", hours 0, blank times, claimNotes, and claimCost;',
    "- every non-claim time entry has a time range whose duration matches hours;",
    "- every warning has sourceRow and reason;",
    "- payCalculation has all required numeric fields.",
    "",
    `Selected month: ${selectedMonth || "not selected"}`,
    `File name: ${fileName || "uploaded.xlsx"}`,
    "",
    "Workbook text:",
    workbookText,
  ].join("\n");
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

async function requireWebadminProfile(request, env) {
  const user = await requireAuthUser(request, env);
  const profile = await getProfileForUser(user.id, env);
  if (String(profile?.role || "").toLowerCase() !== "webadmin") {
    throw new ErrorResponse(403, "This action is available to webadmin accounts only.");
  }
  return { user, profile };
}

async function getOpenRouterSettings(env) {
  if (!env.RAG_DOCS_BUCKET) {
    return {};
  }
  const stored = await env.RAG_DOCS_BUCKET.get(OPENROUTER_SETTINGS_KEY);
  if (!stored) {
    return {};
  }
  const parsed = JSON.parse(await stored.text());
  return {
    chatModel: normalizeOpenRouterModel(parsed?.chatModel, "chatModel"),
    importModel: normalizeOpenRouterModel(parsed?.importModel, "importModel"),
  };
}

async function saveOpenRouterSettings(env, settings) {
  if (!env.RAG_DOCS_BUCKET) {
    throw new ErrorResponse(500, "RAG_DOCS_BUCKET is not configured.");
  }
  await env.RAG_DOCS_BUCKET.put(OPENROUTER_SETTINGS_KEY, JSON.stringify({
    chatModel: settings.chatModel || "",
    importModel: settings.importModel || "",
    updatedAt: new Date().toISOString(),
  }), {
    httpMetadata: {
      contentType: "application/json",
    },
  });
}

function normalizeOpenRouterModel(value, fieldName = "model") {
  const model = String(value || "").trim();
  if (!model) {
    return "";
  }
  if (model.length > 140 || !/^[a-z0-9][a-z0-9._:/-]*$/i.test(model)) {
    throw new ErrorResponse(400, `${fieldName} is not a valid OpenRouter model id.`);
  }
  return model;
}

function getDefaultOpenRouterChatModel(env) {
  return env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
}

function getDefaultOpenRouterImportModel(env) {
  return env.OPENROUTER_IMPORT_MODEL || env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
}

async function resolveOpenRouterChatModel(env) {
  const settings = await getOpenRouterSettings(env);
  return settings.chatModel || getDefaultOpenRouterChatModel(env);
}

async function resolveOpenRouterImportModel(env) {
  const settings = await getOpenRouterSettings(env);
  return settings.importModel || getDefaultOpenRouterImportModel(env);
}

function formatOpenRouterSettingsResponse(settings, env) {
  const defaultChatModel = getDefaultOpenRouterChatModel(env);
  const defaultImportModel = getDefaultOpenRouterImportModel(env);
  return {
    chatModel: settings.chatModel || "",
    importModel: settings.importModel || "",
    effectiveChatModel: settings.chatModel || defaultChatModel,
    effectiveImportModel: settings.importModel || defaultImportModel,
    defaults: {
      chatModel: defaultChatModel,
      importModel: defaultImportModel,
    },
  };
}

async function buildWebadminChatChain(env) {
  const model = new ChatOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: await resolveOpenRouterChatModel(env),
    temperature: Number(env.OPENROUTER_TEMPERATURE || 0.2),
    maxTokens: Number(env.OPENROUTER_MAX_TOKENS || 900),
    siteUrl: env.OPENROUTER_SITE_URL || env.PUBLIC_WORKER_BASE_URL || undefined,
    siteName: env.OPENROUTER_SITE_NAME || "Chess Grande Payroll Admin",
    provider: {
      data_collection: "deny",
    },
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      [
        "You are the private assistant for Chess Grande webadmins.",
        "Answer only from the retrieved private documents and the conversation context.",
        "If the answer is not in the documents, say what is missing and suggest which document to add.",
        "Keep answers concise, operational, and careful with payroll or profile data.",
      ].join(" "),
    ],
    [
      "human",
      [
        "Conversation so far:",
        "{history}",
        "",
        "Retrieved private documents:",
        "{context}",
        "",
        "Webadmin question:",
        "{question}",
      ].join("\n"),
    ],
  ]);

  return RunnableSequence.from([prompt, model, new StringOutputParser()]);
}

function normalizeChatMessages(messages, fallbackMessage) {
  const rawMessages = Array.isArray(messages)
    ? messages
    : [{ role: "user", content: fallbackMessage }];
  return rawMessages
    .slice(-MAX_CHAT_MESSAGES)
    .map((message) => ({
      role: String(message?.role || "user").toLowerCase() === "assistant" ? "assistant" : "user",
      content: String(message?.content || "").trim().slice(0, MAX_CHAT_MESSAGE_CHARS),
    }))
    .filter((message) => message.content);
}

function formatChatHistory(messages) {
  if (!messages.length) return "No earlier messages.";
  return messages
    .map((message) => `${message.role === "assistant" ? "Assistant" : "Webadmin"}: ${message.content}`)
    .join("\n");
}

async function retrieveRagDocuments(question, env) {
  if (!env.RAG_DOCS_BUCKET) return [];

  const prefix = String(env.RAG_DOCS_PREFIX || DEFAULT_RAG_DOCS_PREFIX).replace(/^\/+/, "");
  const listed = await env.RAG_DOCS_BUCKET.list({ prefix, limit: MAX_RAG_FILES });
  const objects = Array.isArray(listed?.objects) ? listed.objects : [];
  const allowedObjects = objects.filter((object) => isSupportedRagKey(object.key));
  const terms = getSearchTerms(question);
  const documents = [];

  for (const object of allowedObjects) {
    const stored = await env.RAG_DOCS_BUCKET.get(object.key);
    if (!stored) continue;
    const text = (await stored.text()).slice(0, MAX_RAG_FILE_CHARS);
    const chunks = chunkText(text, object.key);
    for (const chunk of chunks) {
      const score = scoreChunk(chunk.text, terms);
      if (score > 0 || !terms.length) {
        documents.push({ ...chunk, score });
      }
    }
  }

  return documents
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function isSupportedRagKey(key) {
  return /\.(txt|md|markdown|csv|json)$/i.test(String(key || ""));
}

function getSearchTerms(question) {
  const stopWords = new Set([
    "about", "after", "again", "also", "and", "are", "can", "for", "from",
    "has", "have", "how", "into", "our", "the", "this", "that", "what",
    "when", "where", "which", "with", "you", "your",
  ]);
  return Array.from(new Set(
    String(question || "")
      .toLowerCase()
      .match(/[a-z0-9]{3,}/g) || []
  )).filter((term) => !stopWords.has(term));
}

function chunkText(text, key) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleanText) return [];
  const chunks = [];
  const chunkSize = 1800;
  const overlap = 220;
  for (let start = 0; start < cleanText.length; start += chunkSize - overlap) {
    const value = cleanText.slice(start, start + chunkSize).trim();
    if (value) {
      chunks.push({
        key,
        title: key.split("/").pop() || key,
        text: value,
      });
    }
  }
  return chunks;
}

function scoreChunk(text, terms) {
  if (!terms.length) return 1;
  const lowerText = String(text || "").toLowerCase();
  return terms.reduce((score, term) => {
    const matches = lowerText.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, "g"));
    return score + (matches ? matches.length : 0);
  }, 0);
}

function formatRagContext(documents) {
  let remainingChars = MAX_RAG_CONTEXT_CHARS;
  const parts = [];
  for (const doc of documents) {
    if (remainingChars <= 0) break;
    const excerpt = doc.text.slice(0, remainingChars);
    remainingChars -= excerpt.length;
    parts.push(`[${doc.title}]\n${excerpt}`);
  }
  return parts.join("\n\n---\n\n");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
