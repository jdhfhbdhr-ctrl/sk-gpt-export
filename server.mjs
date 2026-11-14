import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import OpenAI, { toFile } from "openai";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import crypto from "node:crypto";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const MAX_FILE = 25 * 1024 * 1024;

const allowedOrigins = (process.env.CORS_ORIGIN || "https://sk-gpt-export.pages.dev")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "2mb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 60 }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE, files: 1 }
});

let db;
let openai;

function initializeServices() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing.");
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing.");

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  db = getFirestore();
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Please sign in first." });
    req.user = await getAuth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Your session is invalid. Please sign in again." });
  }
}

function karachiDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
}

const LIMITS = { chat: 20, image: 2, pdf: 2, advanced: 3 };

async function consumeQuota(uid, type) {
  const date = karachiDate();
  const ref = db.collection("users").doc(uid).collection("usage").doc(date);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const usage = snap.exists ? snap.data() : {};
    const used = Number(usage[type] || 0);

    if (used >= LIMITS[type]) {
      const error = new Error(`Daily ${type} limit reached (${LIMITS[type]} per day).`);
      error.status = 429;
      throw error;
    }

    tx.set(ref, {
      [type]: used + 1,
      date,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
}

function handleError(res, error) {
  console.error("SK GPT API:", error.message);
  res.status(error.status || 500).json({
    error: error.status === 429
      ? error.message
      : "The request could not be completed. Please try again."
  });
}

function parseMessages(value) {
  try {
    const messages = JSON.parse(value || "[]");
    if (!Array.isArray(messages)) return [];
    return messages.slice(-30).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 20000)
    }));
  } catch {
    return [];
  }
}

app.get("/api/health", (_req, res) => {
  const ready = Boolean(db && openai);
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "not_ready",
    ready,
    app: "SK GPT"
  });
});

// AI chat
app.post("/api/chat", requireAuth, upload.single("file"), async (req, res) => {
  try {
    await consumeQuota(req.user.uid, "chat");

    const text = String(req.body.text || "").slice(0, 20000);
    const language = String(req.body.language || "en");
    const thinkHarder = req.body.thinkHarder === "true";
    const specialMode = String(req.body.specialMode || "");
    const councilMode = req.body.councilMode === "true" && !specialMode;

    if (thinkHarder) await consumeQuota(req.user.uid, "advanced");

    const history = parseMessages(req.body.messages);
    let userContent = text || "Please analyze the attached file.";

    if (req.file) {
      if (req.file.mimetype.startsWith("image/")) {
        const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        history.push({
          role: "user",
          content: [
            { type: "input_text", text: userContent },
            { type: "input_image", image_url: dataUrl }
          ]
        });
      } else if (req.file.mimetype.startsWith("text/")) {
        userContent += "\n\nAttached file:\n" + req.file.buffer.toString("utf8").slice(0, 30000);
        history.push({ role: "user", content: userContent });
      } else {
        return res.status(400).json({ error: "This file type is not supported for chat." });
      }
    } else {
      history.push({ role: "user", content: userContent });
    }

    const specialInstructions = specialMode === "truthRadar"
      ? `You are SK GPT Truth Radar, an evidence-aware scam and deception analyst. Analyze the supplied message, email, job offer or conversation. Do not claim certainty or treat suspicion as proof. Return ONLY valid JSON with this exact shape: {"riskScore":0,"riskLabel":"Low risk|Caution|High scam risk","summary":"short explanation","traps":["red flag 1","red flag 2","red flag 3"],"savageReply":"a firm, safe reply"}. riskScore must be an integer 0-100 representing estimated scam risk, not probability of guilt. Provide exactly 3 concrete red flags; if fewer are present, say so honestly. Never invent evidence. Recommend independent verification and never advise sharing OTPs, passwords or money. Reply text in ${language}.`
      : specialMode === "bargain"
      ? `You are SK GPT Smart Bargainer, a practical consumer negotiation expert. Analyze the item/deal and generate three persuasive but honest negotiation messages. Return ONLY valid JSON with this exact shape: {"itemSummary":"short item/deal summary","messages":{"polite":{"english":"...","urdu":"...","romanUrdu":"..."},"firm":{"english":"...","urdu":"...","romanUrdu":"..."},"walkAway":{"english":"...","urdu":"...","romanUrdu":"..."}}}. Include all three languages for each tone. Do not invent market prices, defects or facts. If price/details are missing, use natural placeholders or ask for them in the messages. Keep messages ready to copy.`
      : "";
    const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

    const response = councilMode ? null : await openai.responses.create({
      model,
      instructions: specialMode
        ? specialInstructions
        : `You are SK GPT, a helpful multilingual AI assistant. Reply in the user's requested language (${language}). Be accurate, clear and helpful.${thinkHarder ? " Think carefully before answering." : ""}`,
      input: history,
      ...(thinkHarder ? { reasoning: { effort: "high" } } : {})
    });

    const reply = response?.output_text || "";
    let specialData = null;

    if (specialMode === "truthRadar" || specialMode === "bargain") {
      try {
        const cleaned = reply.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
        specialData = JSON.parse(cleaned);
      } catch {}
    }

    let councilData = null;
    let finalReply = specialData ? "" : reply;

    if (councilMode && !specialData) {
      const question = text || "Please answer using the conversation context.";

      // Researcher and Critic run in parallel.
      const [researcherResult, criticResult] = await Promise.all([
        openai.responses.create({
          model,
          instructions: `You are the Researcher in SK GPT's AI Council. Respond in ${language}. Identify factual claims, relevant evidence, logic, assumptions and uncertainty. Never invent sources or pretend to browse.`,
          input: history
        }),
        openai.responses.create({
          model,
          instructions: `You are the independent Critic in SK GPT's AI Council. Respond in ${language}. Challenge assumptions, find possible errors, missing context, risks and counterarguments. Do not simply agree with the Researcher.`,
          input: history
        })
      ]);

      const researcher = researcherResult.output_text || "Researcher returned no report.";
      const critic = criticResult.output_text || "Critic returned no report.";

      // Strategist synthesizes both reports.
      const strategistResult = await openai.responses.create({
        model,
        instructions: `You are the Strategist and final decision-maker of SK GPT's AI Council. Respond in ${language}. Reconcile the Researcher's findings and the Critic's objections. Return ONLY valid JSON with keys: finalAnswer (string), strategist (string explaining the synthesis), confidence (integer 0-100), confidenceLabel (string), claimsToCheck (array of strings). Confidence is only a model estimate, never claim independent verification.`,
        input: `USER QUESTION:\n${question}\n\nRESEARCHER REPORT:\n${researcher}\n\nCRITIC REPORT:\n${critic}\n\nProduce the most accurate and practical final answer.`
      });

      try {
        const raw = (strategistResult.output_text || "")
          .replace(/^\s*```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/, "");
        const parsed = JSON.parse(raw);

        finalReply = parsed.finalAnswer || "The Council could not produce a final answer.";
        councilData = {
          researcher,
          critic,
          strategist: parsed.strategist || "",
          confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
          confidenceLabel: parsed.confidenceLabel || "AI confidence estimate",
          claimsToCheck: Array.isArray(parsed.claimsToCheck) ? parsed.claimsToCheck : []
        };
      } catch {
        finalReply = `The Council experts responded, but the final synthesis could not be formatted.\n\nResearcher: ${researcher}\n\nCritic: ${critic}`;
        councilData = {
          researcher,
          critic,
          strategist: "Final synthesis formatting failed.",
          confidence: 0,
          confidenceLabel: "Not assessed",
          claimsToCheck: []
        };
      }
    }

    res.json({ reply: finalReply, specialData, councilData });
  } catch (error) {
    handleError(res, error);
  }
});

// Image generation
app.post("/api/images/generate", requireAuth, upload.none(), async (req, res) => {
  try {
    await consumeQuota(req.user.uid, "image");
    const prompt = String(req.body.text || "").trim().slice(0, 4000);
    if (!prompt) return res.status(400).json({ error: "Please describe the image you want." });

    const result = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    const encoded = result.data?.[0]?.b64_json;
    if (!encoded) throw new Error("Image generation returned no image.");

    res.json({
      content: "Your image is ready.",
      image_url: `data:image/png;base64,${encoded}`
    });
  } catch (error) {
    handleError(res, error);
  }
});

// PDF analysis / text extraction
app.post("/api/pdf/analyze", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file || req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Please attach a PDF file." });
    }

    await consumeQuota(req.user.uid, "pdf");

    const uploaded = await openai.files.create({
      file: await toFile(req.file.buffer, req.file.originalname || "document.pdf", {
        type: "application/pdf"
      }),
      purpose: "user_data"
    });

    const extractOnly = req.body.action === "extract_text";
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions: extractOnly
        ? "Extract the readable text from this PDF. Preserve headings and paragraph order. Return only extracted text."
        : "Analyze this PDF. Give a clear summary, important details, key findings and useful conclusions.",
      input: [{
        role: "user",
        content: [
          { type: "input_file", file_id: uploaded.id },
          { type: "input_text", text: extractOnly ? "Extract all readable text." : "Please analyze this document." }
        ]
      }]
    });

    const output = response.output_text || "";
    if (!output) throw new Error("No text could be extracted from this PDF.");

    res.json({ text: output, content: output, summary: output });
  } catch (error) {
    handleError(res, error);
  }
});

// Create a separate public snapshot; private user data remains private.
app.post("/api/share/:conversationId", requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const conversationId = req.params.conversationId;
    const conversationRef = db.collection("users").doc(uid)
      .collection("conversations").doc(conversationId);

    const conversationSnap = await conversationRef.get();
    if (!conversationSnap.exists) return res.status(404).json({ error: "Conversation not found." });

    const messagesSnap = await conversationRef.collection("messages")
      .orderBy("createdAt", "asc").limit(1000).get();

    const shareId = crypto.randomUUID().replaceAll("-", "");
    const shareRef = db.collection("publicShares").doc(shareId);
    const conversation = conversationSnap.data();

    await shareRef.set({
      title: conversation.title || "Shared conversation",
      createdAt: FieldValue.serverTimestamp(),
      ownerUid: uid
    });

    const messages = messagesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    for (let i = 0; i < messages.length; i += 400) {
      const batch = db.batch();
      messages.slice(i, i + 400).forEach((message) => {
        const { id, ...data } = message;
        batch.set(shareRef.collection("messages").doc(id), data);
      });
      await batch.commit();
    }

    await conversationRef.set({ shared: true, shareId }, { merge: true });

    res.json({
      shareId,
      shareUrl: `${req.protocol}://${req.get("host")}/share/${shareId}`
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Read a public snapshot without exposing private conversation paths.
app.get("/api/share/:shareId", async (req, res) => {
  try {
    const shareRef = db.collection("publicShares").doc(req.params.shareId);
    const snap = await shareRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Shared conversation not found." });

    const messagesSnap = await shareRef.collection("messages").orderBy("createdAt", "asc").limit(1000).get();
    const messages = messagesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || null
      };
    });

    res.json({
      conversation: { title: snap.data().title || "Shared conversation" },
      messages
    });
  } catch (error) {
    handleError(res, error);
  }
});

try {
  initializeServices();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SK GPT API running on port ${PORT}`);
  });
} catch (error) {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
}
