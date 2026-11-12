
const ALLOWED_ORIGIN = "https://sk-gpt-export.pages.dev";
const PROJECT_ID = "sk-gpt-chat";
const FIREBASE_API_KEY = "AIzaSyAPQ8PVEqWUNOu3Ls6qEBu5CttDwW-Sll4";
const LIMITS = { chat: 20, image: 2, pdf: 2, advanced: 3 };

let cachedGoogleToken = null;
let cachedGoogleTokenExpiry = 0;

const json = (data, status = 200, headers = {}) =>
  Response.json(data, { status, headers });

function withCors(response, headers) {
  const merged = new Headers(response.headers);
  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: merged
  });
}

function b64url(input) {
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodePem(pem) {
  return Uint8Array.from(
    atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "")),
    c => c.charCodeAt(0)
  );
}

async function googleAccessToken(env) {
  if (cachedGoogleToken && Date.now() < cachedGoogleTokenExpiry - 60000)
    return cachedGoogleToken;

  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8", decodePem(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)
  );
  const assertion = `${unsigned}.${b64url(signature)}`;

  const response = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error("Google service authentication failed.");
  cachedGoogleToken = data.access_token;
  cachedGoogleTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedGoogleToken;
}

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number")
    return Number.isInteger(value)
      ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(value)) fields[k] = encodeValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function decodeValue(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v)
    return (v.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  return null;
}

function decodeFields(fields = {}) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

function encodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = encodeValue(v);
  return out;
}

async function firestore(env, path, options = {}) {
  const token = await googleAccessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 404) {
    throw new Error(data.error?.message || "Firestore request failed.");
  }
  return { response, data };
}

async function verifyUser(request) {
  const auth = request.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("Please sign in again.");
  const result = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: match[1] })
    }
  );
  const data = await result.json().catch(() => ({}));
  const uid = data.users?.[0]?.localId;
  if (!result.ok || !uid) throw new Error("Your login session is invalid. Please sign in again.");
  return uid;
}

function karachiDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
}


async function consumeQuotas(env, uid, types) {
  const uniqueTypes = [...new Set(types)];
  for (const type of uniqueTypes) {
    if (!Object.prototype.hasOwnProperty.call(LIMITS, type))
      throw new Error("Unknown usage limit.");
  }

  const path = `users/${uid}/usage/${karachiDate()}`;
  const token = await googleAccessToken(env);
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const docName = `${base}/${path}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const begin = await fetch(`${base}:beginTransaction`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ options: { readWrite: {} } })
    });
    const tx = await begin.json();
    if (!begin.ok || !tx.transaction)
      throw new Error("Could not start usage transaction.");

    const read = await fetch(`${base}:batchGet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        documents: [docName],
        transaction: tx.transaction
      })
    });

    const readText = await read.text();
    if (!read.ok)
      throw new Error("Could not read usage limits.");

    const rows = readText.split(/\r?\n/).filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    const row = rows.find(x => x.found || x.missing);
    const fields = row?.found?.fields
      ? decodeFields(row.found.fields) : {};

    // Check every requested limit before incrementing any counter.
    const failedType = uniqueTypes.find(type =>
      Number(fields[type] || 0) >= LIMITS[type]
    );

    if (failedType) {
      await fetch(`${base}:rollback`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transaction: tx.transaction })
      });
      return {
        allowed: false,
        failedType,
        used: Number(fields[failedType] || 0),
        limit: LIMITS[failedType]
      };
    }

    const next = { ...fields, date: karachiDate() };
    for (const type of uniqueTypes)
      next[type] = Number(fields[type] || 0) + 1;

    const commit = await fetch(`${base}:commit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transaction: tx.transaction,
        writes: [{
          update: { name: docName, fields: encodeFields(next) },
          updateMask: { fieldPaths: Object.keys(next) }
        }]
      })
    });

    if (commit.ok) {
      return {
        allowed: true,
        usage: Object.fromEntries(
          uniqueTypes.map(type => [type, next[type]])
        )
      };
    }

    const errorText = await commit.text();
    if (attempt < 3 && /ABORTED|409|transaction/i.test(errorText))
      continue;

    throw new Error("Could not securely update daily usage.");
  }

  throw new Error("Usage transaction retry limit reached.");
}

async function consumeQuota(env, uid, type) {
  const result = await consumeQuotas(env, uid, [type]);
  return result.allowed
    ? { allowed: true, used: result.usage[type], limit: LIMITS[type] }
    : { allowed: false, used: result.used, limit: result.limit };
}

async function openAI(env, path, body, isForm = false) {
  const response = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      ...(isForm ? {} : { "Content-Type": "application/json" })
    },
    body: isForm ? body : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "AI service request failed.");
  return data;
}

function outputText(data) {
  if (data.output_text) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const c of item.content || []) {
      if (c.type === "output_text" && c.text) parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
}

async function chatRoute(request, env, uid) {
  const form = await request.formData();
  const text = String(form.get("text") || "");
  const language = String(form.get("language") || "en");
  const thinkHarder = String(form.get("thinkHarder")) === "true";
  const messages = JSON.parse(String(form.get("messages") || "[]"));
  const file = form.get("file");

  const quotaTypes = thinkHarder ? ["advanced", "chat"] : ["chat"];
  const quota = await consumeQuotas(env, uid, quotaTypes);

  if (!quota.allowed) {
    const type = quota.failedType;
    return json({
      error: `Daily ${type === "advanced" ? "Think" : "chat"} limit reached (${quota.limit}). Please upgrade your plan.`,
      limit: quota.limit,
      used: quota.used,
      type
    }, 429);
  }

  const input = [];
  for (const m of (Array.isArray(messages) ? messages.slice(-20) : [])) {
    if (!m || !["user", "assistant"].includes(m.role)) continue;
    const content = typeof m.content === "string" ? m.content :
      typeof m.text === "string" ? m.text : "";
    if (content) input.push({ role: m.role, content });
  }

  const userContent = [{ type: "input_text", text: text || "Please help me." }];
  if (file && typeof file.arrayBuffer === "function") {
    if (file.type.startsWith("image/")) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      userContent.push({
        type: "input_image",
        image_url: `data:${file.type};base64,${btoa(binary)}`
      });
    } else {
      const extracted = await file.text();
      userContent.push({ type: "input_text", text: `Attached file (${file.name}):\n${extracted.slice(0, 30000)}` });
    }
  }
  input.push({ role: "user", content: userContent });

  const result = await openAI(env, "responses", {
    model: env.OPENAI_MODEL || "gpt-5.4-mini",
    instructions: `You are SK GPT AI. Answer helpfully and naturally in the user's requested language: ${language}.`,
    input,
    ...(thinkHarder ? { reasoning: { effort: "high" } } : {})
  });
  return json({ reply: outputText(result) || "No response was returned." });
}

async function imageRoute(request, env, uid) {
  const form = await request.formData();
  const prompt = String(form.get("text") || form.get("prompt") || "").trim();
  if (!prompt) return json({ error: "Please enter an image prompt." }, 400);

  const quota = await consumeQuota(env, uid, "image");
  if (!quota.allowed) return json({
    error: `Daily image limit reached (${quota.limit}). Please upgrade your plan.`,
    limit: quota.limit, used: quota.used, type: "image"
  }, 429);

  const result = await openAI(env, "images/generations", {
    model: "gpt-image-1",
    prompt,
    size: "1024x1024"
  });
  const encoded = result.data?.[0]?.b64_json;
  if (!encoded) throw new Error("Image generation returned no image.");
  return json({
    content: "Your image is ready.",
    image_url: `data:image/png;base64,${encoded}`
  });
}

async function pdfRoute(request, env, uid) {
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function" || file.type !== "application/pdf")
    return json({ error: "Please attach a PDF file." }, 400);

  const quota = await consumeQuota(env, uid, "pdf");
  if (!quota.allowed) return json({
    error: `Daily PDF limit reached (${quota.limit}). Please upgrade your plan.`,
    limit: quota.limit, used: quota.used, type: "pdf"
  }, 429);

  const upload = new FormData();
  upload.append("purpose", "user_data");
  upload.append("file", file, file.name || "document.pdf");
  const uploaded = await openAI(env, "files", upload, true);
  const action = String(form.get("action") || "summarize");
  const task = action === "extract_text"
    ? "Extract the readable text from this PDF. Preserve headings and order. Return only the extracted text."
    : "Summarize this PDF clearly. Include its main points and important details.";

  const result = await openAI(env, "responses", {
    model: env.OPENAI_MODEL || "gpt-5.4-mini",
    input: [{
      role: "user",
      content: [
        { type: "input_file", file_id: uploaded.id },
        { type: "input_text", text: task }
      ]
    }]
  });
  const content = outputText(result);
  return json({ text: content, content, summary: content });
}

async function shareCreate(request, env, uid, conversationId) {
  const convPath = `users/${uid}/conversations/${conversationId}`;
  const conv = await firestore(env, convPath);
  if (!conv.data.name) return json({ error: "Conversation not found." }, 404);

  const messagesResult = await firestore(env, `${convPath}/messages?pageSize=1000&orderBy=createdAt`);
  const docs = messagesResult.data.documents || [];
  const shareId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(x => x.toString(16).padStart(2, "0")).join("");

  const sharePath = `publicShares/${shareId}`;
  const shareFields = {
    title: decodeFields(conv.data.fields || {}).title || "Shared conversation",
    ownerUid: uid,
    createdAt: new Date().toISOString()
  };
  await firestore(env, sharePath, {
    method: "PATCH",
    body: JSON.stringify({ fields: encodeFields(shareFields) })
  });

  for (const doc of docs) {
    const id = doc.name.split("/").pop();
    await firestore(env, `${sharePath}/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: doc.fields || {} })
    });
  }

  const updated = {
    shared: encodeValue(true),
    shareId: encodeValue(shareId)
  };
  await firestore(env, `${convPath}?updateMask.fieldPaths=shared&updateMask.fieldPaths=shareId`, {
    method: "PATCH",
    body: JSON.stringify({ fields: updated })
  });

  return json({
    shareId,
    shareUrl: `${new URL(request.url).origin}/share/${shareId}`
  });
}

async function shareRead(env, shareId) {
  const share = await firestore(env, `publicShares/${shareId}`);
  if (!share.data.name) return json({ error: "Shared conversation not found." }, 404);
  const messages = await firestore(env, `publicShares/${shareId}/messages?pageSize=1000&orderBy=createdAt`);
  return json({
    conversation: decodeFields(share.data.fields || {}),
    messages: (messages.data.documents || []).map(d => ({
      id: d.name.split("/").pop(),
      ...decodeFields(d.fields || {})
    }))
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Origin": (
        origin === ALLOWED_ORIGIN ||
        (origin.startsWith("https://") &&
         new URL(origin).hostname.endsWith(".sk-gpt-export.pages.dev"))
      ) ? origin : ALLOWED_ORIGIN,
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });

    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/health" && request.method === "GET") {
        const checks = {
          firebaseOAuth: false,
          firestore: false,
          openai: false
        };

        try {
          const token = await googleAccessToken(env);
          checks.firebaseOAuth = true;

          const db = await fetch(
            `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?pageSize=1`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          checks.firestore = db.ok;
        } catch (_) {}

        try {
          const ai = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }
          });
          checks.openai = ai.ok;
        } catch (_) {}

        const ready = Object.values(checks).every(Boolean);
        return json({
          status: ready ? "ok" : "degraded",
          ready,
          app: "SK GPT",
          stage: "worker-backend",
          checks
        }, 200, headers);
      }

      if (url.pathname === "/api/share" && request.method === "GET")
        return json({ error: "Share ID is required." }, 400, headers);

      const publicShare = url.pathname.match(/^\/api\/share\/([^/]+)$/);
      if (publicShare && request.method === "GET")
        return withCors(await shareRead(env, decodeURIComponent(publicShare[1])), headers);

      const uid = await verifyUser(request);

      if (url.pathname === "/api/chat" && request.method === "POST")
        return withCors(await chatRoute(request, env, uid), headers);

      if (url.pathname === "/api/images/generate" && request.method === "POST")
        return withCors(await imageRoute(request, env, uid), headers);

      if (url.pathname === "/api/pdf/analyze" && request.method === "POST")
        return withCors(await pdfRoute(request, env, uid), headers);

      const createShare = url.pathname.match(/^\/api\/share\/([^/]+)$/);
      if (createShare && request.method === "POST")
        return withCors(await shareCreate(request, env, uid, decodeURIComponent(createShare[1])), headers);

      return json({ error: "Route not found." }, 404, headers);
    } catch (error) {
      const message = error?.message || "Request failed.";
      const status = /sign in|login session|invalid/i.test(message) ? 401 : 500;
      return json({ error: message }, status, headers);
    }
  }
};
