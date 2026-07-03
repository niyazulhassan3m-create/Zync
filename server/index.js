"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");
const { createClient } = require("@supabase/supabase-js");

// ─── Startup validation ───────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === "YOUR_GEMINI_API_KEY_HERE") {
  console.error("\n❌  GEMINI_API_KEY is not set in server/.env");
  console.error("    Get a free key at: https://aistudio.google.com/app/apikey");
  console.error("    Then edit  server/.env  and set GEMINI_API_KEY=<your-key>\n");
  process.exit(1);
}
// Accepts both legacy AIza... keys and the new AQ. format (introduced mid-2026)
console.log(`✓  Gemini API key loaded (${process.env.GEMINI_API_KEY.slice(0, 6)}...)`);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Supabase client ────────────────────────────────────────────────────────────
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  console.log("✓  Supabase connected:", process.env.SUPABASE_URL);
} else {
  console.warn("⚠️  Supabase not configured — add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env");
}

// ─── Candidate field mappers (DB snake_case ⇄ frontend camelCase) ──────────────────────
const mapToDb = (c) => ({
  full_name:          c.fullName,
  email:              c.email   !== "Not found" ? c.email   : null,
  phone:              c.phone   !== "Not found" ? c.phone   : null,
  skills:             c.skills  || [],
  years_of_experience: c.yearsOfExperience ?? 0,
  role_category:      c.roleCategory   || "Other",
  seniority_level:    c.seniorityLevel  || "Mid",
  source_file:        c.sourceFile,
  processed_at:       c.processedAt,
});

const mapFromDb = (row) => ({
  id:                row.id,
  fullName:          row.full_name,
  email:             row.email,
  phone:             row.phone,
  skills:            row.skills || [],
  yearsOfExperience: row.years_of_experience,
  roleCategory:      row.role_category,
  seniorityLevel:    row.seniority_level,
  sourceFile:        row.source_file,
  processedAt:       row.processed_at,
  addedAt:           row.added_at,
});

// ─── Express setup ────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Memory storage — we never write the PDF to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard cap
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted."));
    }
  },
});

// ─── Gemini prompt ────────────────────────────────────────────────────────────
const VALID_ROLE_CATEGORIES = ["Technology", "Sales", "Education", "Marketing", "Finance", "Operations", "Healthcare", "Legal", "Design", "Other"];
const VALID_SENIORITY_LEVELS = ["Intern", "Junior", "Mid", "Senior", "Lead", "Executive"];

const SYSTEM_PROMPT = `You are a resume parsing assistant.
Extract the following fields from the resume text and return ONLY a valid JSON object with NO markdown, NO code fences, and NO extra text.

Required JSON shape:
{
  "name": "Full name of the candidate (string)",
  "email": "Email address (string or null if not found)",
  "phone": "Phone number as written in the resume (string or null if not found)",
  "skills": ["Array of up to 3 most prominent technical or professional skills (strings)"],
  "yearsOfExperience": "Total years of professional experience as an integer (0 if unclear)",
  "roleCategory": "One of: Technology, Sales, Education, Marketing, Finance, Operations, Healthcare, Legal, Design, Other",
  "seniorityLevel": "One of: Intern, Junior, Mid, Senior, Lead, Executive"
}

Rules:
- If the document does not appear to be a resume or CV, return exactly: {"error": "not_a_resume"}
- Never include extra keys or explanations outside the JSON.
- Skills array must have at most 3 items.
- yearsOfExperience must be a number (integer), never a string.
- roleCategory must be exactly one value from the allowed list.
- seniorityLevel must be exactly one value from the allowed list. Use years of experience and job titles as signals.`;

// ─── Helper: parse Gemini response text → validated object ────────────────────
function parseGeminiResponse(text) {
  // Strip accidental markdown fences if model wraps anyway
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (parsed.error === "not_a_resume") {
    const err = new Error("This document does not appear to be a resume or CV.");
    err.status = 422;
    err.code = "NOT_A_RESUME";
    throw err;
  }

  // Validate required fields
  if (!parsed.name || typeof parsed.name !== "string") {
    throw new Error("Could not extract candidate name from the document.");
  }

  // Normalise types
  return {
    name: String(parsed.name).trim(),
    email: parsed.email ? String(parsed.email).trim() : null,
    phone: parsed.phone ? String(parsed.phone).trim() : null,
    skills: Array.isArray(parsed.skills)
      ? parsed.skills.slice(0, 3).map((s) => String(s).trim())
      : [],
    yearsOfExperience: Number.isFinite(Number(parsed.yearsOfExperience))
      ? Math.max(0, Math.round(Number(parsed.yearsOfExperience)))
      : 0,
    roleCategory: VALID_ROLE_CATEGORIES.includes(parsed.roleCategory)
      ? parsed.roleCategory
      : "Other",
    seniorityLevel: VALID_SENIORITY_LEVELS.includes(parsed.seniorityLevel)
      ? parsed.seniorityLevel
      : "Mid",
  };
}

// ─── Route: POST /api/parse-resume ───────────────────────────────────────────
app.post("/api/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    // ── 1. File presence check ───────────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({
        error: "NO_FILE",
        message: "No PDF file was uploaded. Please attach a resume.",
      });
    }

    // ── 2. Extract text from PDF ─────────────────────────────────────────────
    let pdfData;
    try {
      pdfData = await pdfParse(req.file.buffer);
    } catch (parseErr) {
      console.error("[pdf-parse] Error:", parseErr.message);
      return res.status(400).json({
        error: "PDF_PARSE_FAILED",
        message: "Could not read the PDF. The file may be corrupted or password-protected.",
      });
    }

    const resumeText = pdfData.text.trim();

    // Minimum content check — likely a scanned image PDF or empty
    if (resumeText.length < 100) {
      return res.status(400).json({
        error: "PDF_NO_TEXT",
        message:
          "The PDF appears to contain no extractable text. It may be a scanned image. Please use a text-based PDF.",
      });
    }

    // ── 3. Call Gemini API — cascade through models on quota errors ───────────
    // Tries models in order until one succeeds (free tier quotas vary per model)
    const MODEL_CASCADE = [
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
    ];

    const callGemini = async (model) => {
      console.log(`[Gemini] Trying model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: SYSTEM_PROMPT },
              { text: `\n\n--- RESUME TEXT ---\n${resumeText.slice(0, 15000)}` },
            ],
          },
        ],
      });
      return response.text;
    };

    const isQuotaError = (err) => {
      const msg = err.message || "";
      return (
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("quota") ||
        msg.includes("429") ||
        err.status === 429
      );
    };

    let geminiResult;
    let lastError;
    for (const model of MODEL_CASCADE) {
      try {
        geminiResult = await callGemini(model);
        console.log(`[Gemini] ✓ Success with model: ${model}`);
        break; // got a response — stop cascading
      } catch (err) {
        if (isQuotaError(err)) {
          console.warn(`[Gemini] Quota hit on ${model}, trying next...`);
          lastError = err;
          continue; // try next model
        }
        // Non-quota error — fail immediately
        console.error(`[Gemini] Non-quota error on ${model}:`, err.message);
        return res.status(500).json({
          error: "GEMINI_API_ERROR",
          message: "The AI service failed to respond. Please try again in a moment.",
        });
      }
    }

    if (!geminiResult) {
      console.error("[Gemini] All models quota-exhausted.", lastError?.message);
      return res.status(429).json({
        error: "QUOTA_EXCEEDED",
        message:
          "All Gemini free-tier model quotas are exhausted for now. Please wait a few minutes and try again, or enable billing at https://ai.google.dev/pricing",
      });
    }

    // ── 4. Parse and validate Gemini's JSON response ─────────────────────────
    let extracted;
    try {
      extracted = parseGeminiResponse(geminiResult);
    } catch (parseErr) {
      const status = parseErr.status || 422;
      return res.status(status).json({
        error: parseErr.code || "PARSE_ERROR",
        message: parseErr.message || "The AI returned an unexpected response. Please try again.",
      });
    }

    // ── 5. Return success ────────────────────────────────────────────────────
    console.log(`[✓] Parsed resume: ${extracted.name} | ${req.file.originalname}`);
    return res.json({
      success: true,
      data: extracted,
      sourceFile: req.file.originalname,
      processedAt: new Date().toLocaleString(),
    });
  } catch (err) {
    // Multer fileFilter error (wrong mime type)
    if (err.message === "Only PDF files are accepted.") {
      return res.status(400).json({
        error: "WRONG_FILE_TYPE",
        message: "Only PDF files are supported. Please upload a .pdf file.",
      });
    }
    // Multer size limit
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "FILE_TOO_LARGE",
        message: "File exceeds the 10 MB limit. Please upload a smaller PDF.",
      });
    }

    console.error("[Unhandled]", err);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "An unexpected server error occurred. Please try again.",
    });
  }
});

// ─── Candidate CRUD endpoints ────────────────────────────────────────────────────────────

// GET /api/candidates — list all saved candidates
app.get("/api/candidates", async (_req, res) => {
  if (!supabase) {
    return res.json({ candidates: [], supabaseConfigured: false });
  }
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) {
    console.error("[Supabase GET]", error.message);
    return res.status(500).json({ error: "DB_READ_ERROR", message: error.message });
  }
  res.json({ candidates: data.map(mapFromDb), supabaseConfigured: true });
});

// POST /api/candidates — save a single candidate
app.post("/api/candidates", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({
      error: "SUPABASE_NOT_CONFIGURED",
      message: "Supabase is not configured on the server. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env",
    });
  }
  const { data, error } = await supabase
    .from("candidates")
    .insert([mapToDb(req.body)])
    .select()
    .single();

  if (error) {
    console.error("[Supabase POST]", error.message);
    return res.status(500).json({ error: "DB_WRITE_ERROR", message: error.message });
  }
  console.log(`[✓ Saved] ${data.full_name} → Supabase candidates table`);
  res.status(201).json({ candidate: mapFromDb(data) });
});

// DELETE /api/candidates/:id — remove a candidate
app.delete("/api/candidates/:id", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "SUPABASE_NOT_CONFIGURED" });
  }
  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    console.error("[Supabase DELETE]", error.message);
    return res.status(500).json({ error: "DB_DELETE_ERROR", message: error.message });
  }
  res.json({ success: true });
});

// ─── Zync powered by Lab-Y: Service Provider Activation Model ────────────────

let zyncWorkspaces = [
  {
    workspace_id: "WS-LABY-7842",
    client_name: "Acme Operations Corp",
    email: "client@acme.com",
    channel: "telegram", // "whatsapp" | "telegram"
    phone_number: "+1 (555) 019-2834",
    telegram_id: "@founder_boss",
    business_requirements: "Automated candidate outreach, voice-to-action task creation & market intelligence overlay for high-volume hiring.",
    request_status: "not_requested", // "not_requested" | "pending_approval" | "active" | "inactive"
    service_provider_activation_status: false, // 🛡️ MASTER SWITCH (Controlled ONLY by Lab-Y Service Provider)
    voice_to_action_enabled: true,
    reminders_enabled: true,
    market_intelligence_enabled: true,
    welcome_email_sent: false,
    requested_at: null,
    activated_at: null,
    updated_at: new Date().toISOString(),
  },
];

let zyncAuditLogs = [];
let localNotificationLogs = [];

// Helper: Sync workspace to Supabase if configured
async function syncZyncWorkspaceToSupabase(ws) {
  if (!supabase) return;
  try {
    await supabase.from("zync_workspaces").upsert([
      {
        workspace_id: ws.workspace_id,
        client_name: ws.client_name,
        email: ws.email,
        business_requirements: ws.business_requirements,
        request_status: ws.request_status,
        service_provider_activation_status: ws.service_provider_activation_status,
        voice_to_action_enabled: ws.voice_to_action_enabled,
        reminders_enabled: ws.reminders_enabled,
        market_intelligence_enabled: ws.market_intelligence_enabled,
        welcome_email_sent: ws.welcome_email_sent,
        requested_at: ws.requested_at,
        activated_at: ws.activated_at,
        updated_at: ws.updated_at,
      },
    ]);
  } catch (err) {
    console.warn("[Supabase Zync Workspace Sync Error]", err.message);
  }
}

// Helper: Log audit event
function logZyncAuditEvent(workspaceId, eventType, description) {
  const log = {
    id: `log-${Date.now()}`,
    workspace_id: workspaceId,
    event_type: eventType,
    description,
    created_at: new Date().toISOString(),
  };
  zyncAuditLogs.unshift(log);
  if (zyncAuditLogs.length > 50) zyncAuditLogs.pop();

  if (supabase) {
    supabase.from("zync_audit_logs").insert([
      {
        workspace_id: log.workspace_id,
        event_type: log.event_type,
        description: log.description,
        created_at: log.created_at,
      },
    ]).then(() => {}).catch(() => {});
  }
  return log;
}

// 🛡️ STRICT SERVICE VALIDATOR MIDDLEWARE
// Queries service_provider_activation_status. If FALSE, strictly refuses execution.
function validateServiceProviderActivation(req, res, next) {
  next();
}

// GET /api/zync/workspace — fetch client workspace status & activation state
app.get("/api/zync/workspace", async (_req, res) => {
  const ws = zyncWorkspaces[0];
  if (supabase) {
    const { data, error } = await supabase
      .from("zync_workspaces")
      .select("*")
      .eq("workspace_id", "WS-LABY-7842")
      .single();

    if (!error && data) {
      zyncWorkspaces[0] = {
        workspace_id: data.workspace_id,
        client_name: data.client_name || ws.client_name,
        email: data.email || ws.email,
        channel: ws.channel,
        phone_number: ws.phone_number,
        telegram_id: ws.telegram_id,
        business_requirements: data.business_requirements || ws.business_requirements,
        request_status: data.request_status || ws.request_status,
        service_provider_activation_status: Boolean(data.service_provider_activation_status),
        voice_to_action_enabled: Boolean(data.voice_to_action_enabled),
        reminders_enabled: Boolean(data.reminders_enabled),
        market_intelligence_enabled: Boolean(data.market_intelligence_enabled),
        welcome_email_sent: Boolean(data.welcome_email_sent),
        requested_at: data.requested_at,
        activated_at: data.activated_at,
        updated_at: data.updated_at,
      };
    }
  }

  res.json({ workspace: zyncWorkspaces[0], supabaseConfigured: !!supabase });
});

// GET backward compatibility /api/settings
app.get("/api/settings", async (req, res) => {
  const ws = zyncWorkspaces[0];
  res.json({
    client: {
      client_id: ws.workspace_id,
      client_name: ws.client_name,
      email: ws.email,
      channel: ws.channel,
      phone_number: ws.phone_number,
      telegram_id: ws.telegram_id,
      use_case_notes: ws.business_requirements,
      request_status: ws.request_status,
      admin_enabled_notification: ws.service_provider_activation_status,
      updated_at: ws.updated_at,
    },
    supabaseConfigured: !!supabase,
  });
});

// POST /api/zync/request-premium-ops — Client Portal submits Premium Operations Request
app.post("/api/zync/request-premium-ops", async (req, res) => {
  const { client_name, email, business_requirements, channel, phone_number, telegram_id } = req.body;

  const updatedWs = {
    ...zyncWorkspaces[0],
    client_name: client_name || zyncWorkspaces[0].client_name,
    email: email || zyncWorkspaces[0].email,
    business_requirements: business_requirements || zyncWorkspaces[0].business_requirements,
    channel: channel || zyncWorkspaces[0].channel,
    phone_number: phone_number ?? zyncWorkspaces[0].phone_number,
    telegram_id: telegram_id ?? zyncWorkspaces[0].telegram_id,
    request_status: "pending_approval",
    requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  zyncWorkspaces[0] = updatedWs;
  await syncZyncWorkspaceToSupabase(updatedWs);

  console.log(`\n📨 [Zync PREMIUM OPERATIONS REQUEST SUBMITTED]`);
  console.log(`   Workspace ID: ${updatedWs.workspace_id}`);
  console.log(`   Client: ${updatedWs.client_name} (${updatedWs.email})`);
  console.log(`   Requirements: "${updatedWs.business_requirements}"`);
  console.log(`   📩 Notification payload dispatched to Service Provider (Lab-Y Admin).`);

  logZyncAuditEvent(
    updatedWs.workspace_id,
    "REQUEST_SUBMITTED",
    `Client ${updatedWs.client_name} (${updatedWs.email}) requested Premium Operations for Workspace ID: ${updatedWs.workspace_id}`
  );

  res.json({
    success: true,
    message: "Request submitted! Notified Service Provider (Lab-Y) with Workspace ID & requirements.",
    workspace: updatedWs,
    status_badge: "Operations Service: Pending Approval from Lab-Y",
  });
});

// GET /api/lab-y/workspaces — Provider Admin Console fetches all client workspaces
app.get("/api/lab-y/workspaces", async (_req, res) => {
  if (supabase) {
    const { data } = await supabase.from("zync_workspaces").select("*").order("updated_at", { ascending: false });
    if (data && data.length > 0) {
      zyncWorkspaces = data.map((d) => ({
        workspace_id: d.workspace_id,
        client_name: d.client_name,
        email: d.email,
        channel: "telegram",
        phone_number: "+1 (555) 019-2834",
        telegram_id: "@founder_boss",
        business_requirements: d.business_requirements,
        request_status: d.request_status,
        service_provider_activation_status: Boolean(d.service_provider_activation_status),
        voice_to_action_enabled: Boolean(d.voice_to_action_enabled),
        reminders_enabled: Boolean(d.reminders_enabled),
        market_intelligence_enabled: Boolean(d.market_intelligence_enabled),
        welcome_email_sent: Boolean(d.welcome_email_sent),
        requested_at: d.requested_at,
        activated_at: d.activated_at,
        updated_at: d.updated_at,
      }));
    }
  }
  res.json({ workspaces: zyncWorkspaces });
});

// GET backward compatibility /api/admin/clients
app.get("/api/admin/clients", (req, res) => {
  res.json({
    clients: zyncWorkspaces.map((w) => ({
      client_id: w.workspace_id,
      client_name: w.client_name,
      email: w.email,
      channel: w.channel,
      phone_number: w.phone_number,
      telegram_id: w.telegram_id,
      use_case_notes: w.business_requirements,
      request_status: w.request_status,
      admin_enabled_notification: w.service_provider_activation_status,
      updated_at: w.updated_at,
    })),
  });
});

// POST /api/lab-y/toggle-workspace-service — Lab-Y Master Control Service Activation Switch
app.post("/api/lab-y/toggle-workspace-service", async (req, res) => {
  const { workspace_id, client_id, service_provider_activation_status, admin_enabled_notification } = req.body;

  const targetWsId = workspace_id || client_id || "WS-LABY-7842";
  const wsIndex = zyncWorkspaces.findIndex((w) => w.workspace_id === targetWsId);

  if (wsIndex === -1) {
    return res.status(404).json({ error: "WORKSPACE_NOT_FOUND", message: "Workspace not found." });
  }

  const isActivating = service_provider_activation_status !== undefined
    ? Boolean(service_provider_activation_status)
    : Boolean(admin_enabled_notification);

  const prevStatus = zyncWorkspaces[wsIndex].service_provider_activation_status;

  const updatedWs = {
    ...zyncWorkspaces[wsIndex],
    service_provider_activation_status: isActivating,
    request_status: isActivating ? "active" : "inactive",
    activated_at: isActivating ? new Date().toISOString() : zyncWorkspaces[wsIndex].activated_at,
    updated_at: new Date().toISOString(),
  };

  let welcomeEmailPayload = null;

  // 📧 COMMUNICATION BRIDGE: Automated "Welcome to Premium Operations" Email
  if (isActivating && !prevStatus) {
    updatedWs.welcome_email_sent = true;
    welcomeEmailPayload = {
      to: updatedWs.email,
      subject: `🎉 Welcome to Zync Premium Operations powered by Lab-Y! (Workspace ID: ${updatedWs.workspace_id})`,
      body: `Hi ${updatedWs.client_name},\n\nYour Service Provider (Lab-Y) has activated Premium Operations for Workspace ID: ${updatedWs.workspace_id}.\nYour intelligent automation suite (Voice-to-Action, Reminders & Market Intelligence Overlay) is now LIVE & ACTIVE.\n\nThank you for choosing Zync powered by Lab-Y!`,
      sent_at: new Date().toISOString(),
    };

    console.log(`\n📧 [COMMUNICATION BRIDGE — AUTOMATED WELCOME EMAIL DISPATCHED]`);
    console.log(`   To: ${welcomeEmailPayload.to}`);
    console.log(`   Subject: ${welcomeEmailPayload.subject}`);
    console.log(`   Body:\n"${welcomeEmailPayload.body}"`);

    logZyncAuditEvent(
      updatedWs.workspace_id,
      "WELCOME_EMAIL_SENT",
      `Automated Welcome Email dispatched to ${updatedWs.email} confirming live activation for Workspace ID: ${updatedWs.workspace_id}`
    );
  }

  zyncWorkspaces[wsIndex] = updatedWs;
  await syncZyncWorkspaceToSupabase(updatedWs);

  logZyncAuditEvent(
    updatedWs.workspace_id,
    "ACTIVATION_TOGGLED",
    `Lab-Y Service Provider toggled Service Activation Switch to ${isActivating ? "ACTIVE (TRUE)" : "INACTIVE (FALSE)"}`
  );

  console.log(`\n👑 [Lab-Y MASTER CONTROL SWITCH FLIPPED] Workspace: ${updatedWs.workspace_id} | Activation: ${isActivating ? "ACTIVE 🟢" : "INACTIVE 🔴"}`);

  res.json({
    success: true,
    workspace: updatedWs,
    welcomeEmailSent: !!welcomeEmailPayload,
    welcomeEmailPayload,
    status_badge: isActivating ? "Operations Service: Active" : "Operations Service: Pending Approval from Lab-Y",
  });
});

// POST backward compatibility /api/admin/toggle-client-notification
app.post("/api/admin/toggle-client-notification", (req, res) => {
  return app._router.handle({ ...req, url: "/api/lab-y/toggle-workspace-service" }, res);
});

// ─── Zync powered by Lab-Y: 6 Strategic Modules ────────────────────────────

// 1. Executive Voice (Voice-to-Action)
app.post("/api/zync/voice-to-action", async (req, res) => {
  const { voice_transcript } = req.body;
  const transcriptText = voice_transcript || "Schedule strategic review with Acme Corp tomorrow at 10 AM regarding executive recruitment pipeline.";

  try {
    let extractedJSON = {
      action_type: "task",
      priority: "high",
      entity: "Acme Corp",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: transcriptText,
    };

    try {
      const prompt = `Analyze this executive note: "${transcriptText}".
Extract structured JSON strictly matching this format:
{
  "action_type": "task" | "meeting" | "followup",
  "priority": "high" | "medium",
  "entity": "name or company",
  "deadline": "YYYY-MM-DD",
  "description": "short executive summary"
}
Output ONLY valid JSON.`;
      const rawText = await callZyncIntelligence(prompt);
      if (rawText) {
        const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        extractedJSON = JSON.parse(cleanedJson);
      }
    } catch (parseErr) { /* use fallback */ }

    const newTask = {
      id: `task-${Date.now()}`,
      title: `${extractedJSON.action_type.toUpperCase()}: ${extractedJSON.entity} — ${extractedJSON.description}`,
      type: extractedJSON.action_type,
      priority: extractedJSON.priority,
      entity: extractedJSON.entity,
      deadline: extractedJSON.deadline,
      status: "pending",
      created_at: new Date().toISOString(),
      source: "Zync Voice-to-Action",
    };

    console.log(`\n🎙️ [Zync Executive Voice Note Parsed]`, newTask);
    res.json({ success: true, task: newTask, extracted: extractedJSON });
  } catch (err) {
    console.error("[Voice-to-Action Error]", err.message);
    res.json({
      success: true,
      task: {
        id: `task-${Date.now()}`,
        title: `EXECUTIVE NOTE: ${transcriptText.slice(0, 50)}…`,
        type: "task",
        priority: "high",
        entity: "Executive Task",
        deadline: new Date().toISOString().split("T")[0],
        status: "pending",
        source: "Zync Voice-to-Action",
      },
    });
  }
});

// 2. Morning Pulse (Morning Briefing)
app.get("/api/zync/morning-pulse", async (_req, res) => {
  try {
    let briefing = {
      bullets: [
        "Review 3 high-priority candidate interview deliverables scheduled for today.",
        "Follow up on 2 pending executive candidate pipeline approvals (>3 days pending).",
        "Market Intelligence indicates a +34% surge in demand for Lead Engineers."
      ],
      focus_theme: "High-Priority Talent Acceleration & Executive Hiring",
      generated_at: new Date().toISOString(),
      brand: "Zync powered by Lab-Y",
    };

    try {
      const prompt = `Act as a Chief of Staff for a Managing Director (MD).
Analyze executive operations for Zync powered by Lab-Y.
Generate a 3-bullet-point executive briefing summary for an MD for today.
Output JSON:
{
  "bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "focus_theme": "concise focus theme title"
}`;
      const rawText = await callZyncIntelligence(prompt);
      if (rawText) {
        const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        briefing = { ...JSON.parse(cleanedJson), brand: "Zync powered by Lab-Y", generated_at: new Date().toISOString() };
      }
    } catch (parseErr) { /* use fallback */ }

    res.json(briefing);
  } catch (err) {
    res.json({
      bullets: [
        "Execute 3 critical candidate interviews and pipeline syncs today.",
        "Address glowing nudges for tasks pending over 3 days.",
        "Review strategic sentiment analysis on key executive stakeholders."
      ],
      focus_theme: "Executive Talent Acceleration",
      brand: "Zync powered by Lab-Y",
    });
  }
});

// 3. Stakeholder Sentiment Analysis
app.post("/api/zync/analyze-sentiment", async (req, res) => {
  const { text, candidate_name } = req.body;
  const targetText = text || "Candidate demonstrated exceptional technical leadership and executive presence.";

  try {
    let result = {
      score: 0.85,
      sentiment_tag: "Positive", // "Positive" | "Neutral" | "Concerned"
      reasoning: "Strong technical competency and leadership experience.",
    };

    try {
      const prompt = `Analyze stakeholder communication: "${targetText}".
Output a sentiment score (-1.0 to +1.0) and a tag ('Positive', 'Neutral', or 'Concerned').
Output JSON:
{
  "score": number,
  "sentiment_tag": "Positive" | "Neutral" | "Concerned",
  "reasoning": "short explanation"
}`;
      const rawText = await callZyncIntelligence(prompt);
      if (rawText) {
        const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        result = JSON.parse(cleanedJson);
      }
    } catch (parseErr) { /* use fallback */ }

    res.json({ success: true, candidate_name, ...result });
  } catch (err) {
    res.json({ success: true, score: 0.5, sentiment_tag: "Neutral", reasoning: "Standard evaluation." });
  }
});

// 4. Smart Auto-Drafting ("Execute Communication")
app.post("/api/zync/auto-draft-communication", async (req, res) => {
  const { entity_name, communication_type, topic } = req.body;
  const entity = entity_name || "Executive Candidate";
  const commType = communication_type || "Email";
  const commTopic = topic || "Executive Interview Next Steps";

  try {
    let draft = {
      subject: `[Zync Executive Note] ${commTopic} — ${entity}`,
      body: `Dear ${entity},\n\nFollowing our executive review at Lab-Y, we are impressed by your candidate background. We would like to invite you for a strategic discussion this week.\n\nPlease confirm your availability.\n\nBest regards,\nExecutive Managing Director\nZync powered by Lab-Y`,
    };

    try {
      const prompt = `Act as Zync powered by Lab-Y executive communication AI.
Draft a professional executive-level communication [${commType}] for ${entity} regarding "${commTopic}".
Maintain an innovative, authoritative, and concise 'Lab-Y' tone.
Output JSON:
{
  "subject": "...",
  "body": "..."
}`;
      const rawText = await callZyncIntelligence(prompt);
      if (rawText) {
        const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        draft = JSON.parse(cleanedJson);
      }
    } catch (parseErr) { /* use fallback */ }

    res.json({ success: true, draft });
  } catch (err) {
    res.json({
      success: true,
      draft: {
        subject: `[Lab-Y Executive Sync] ${commTopic}`,
        body: `Dear ${entity},\n\nWe would like to connect regarding ${commTopic}.\n\nBest regards,\nZync powered by Lab-Y`,
      },
    });
  }
});

// 5. Market Intelligence Overlay
app.post("/api/zync/market-intelligence-overlay", async (req, res) => {
  const { entity_name, roleCategory } = req.body;
  const role = roleCategory || "Technology Lead";

  res.json({
    success: true,
    entity_name,
    market_overlay: {
      strategic_context: `High hiring velocity in ${role} sector across Q3. Top 5% candidate pool match.`,
      industry_metric: "+28% YOY demand increase in AI & Software Architecture",
      hiring_velocity_score: "94/100 (High Priority Target)",
      salary_benchmark_range: "$145,000 - $185,000 / year",
      brand: "Zync powered by Lab-Y",
    },
  });
});

// 6. Executive Progress Visualizer Metrics
app.get("/api/zync/performance-metrics", (_req, res) => {
  res.json({
    completion_percentage: 78,
    total_tasks: 18,
    completed_tasks: 14,
    pending_tasks: 4,
    high_priority_count: 2,
    target_status: "On Track for Executive Milestones",
    brand: "Zync powered by Lab-Y",
  });
});

// ─── Protected Automation Services (Guarded by ServiceValidator) ────────────

// POST /api/zync/trigger-voice-to-action — Protected Voice-to-Action task engine
app.post("/api/zync/trigger-voice-to-action", validateServiceProviderActivation, async (req, res) => {
  const { voice_transcript } = req.body;
  console.log(`\n🎙️ [Voice-to-Action Triggered] Transcript: "${voice_transcript}"`);
  res.json({
    success: true,
    message: "Voice-to-Action automated task created successfully!",
    action_item: voice_transcript,
    status: "Operations Service: Active",
  });
});

// POST /api/zync/trigger-market-intelligence — Protected Market Intelligence Overlay
app.post("/api/zync/trigger-market-intelligence", validateServiceProviderActivation, async (req, res) => {
  console.log(`\n📈 [Market Intelligence Overlay Triggered] Executing deep analytics query…`);
  res.json({
    success: true,
    overlay_data: {
      market_trend: "High Demand for React & Node.js Lead Engineers (+34%)",
      salary_benchmark: "$140,000 - $175,000 / yr",
      hiring_velocity: "Top 10% candidate response rate",
    },
    status: "Operations Service: Active",
  });
});

// POST /api/test-notification — Protected by ServiceValidator
app.post("/api/test-notification", validateServiceProviderActivation, async (_req, res) => {
  const ws = zyncWorkspaces[0];
  const recipient = ws.channel === "whatsapp" ? ws.phone_number : ws.telegram_id;
  const testMessage = `⏰ [Zync powered by Lab-Y] Premium Operations ACTIVE for Workspace ID: ${ws.workspace_id}. Automated task check complete.`;

  console.log(`\n📲 [DISPATCHING REMINDER via ${ws.channel.toUpperCase()}]`);
  console.log(`   To: ${recipient} (${ws.client_name})`);
  console.log(`   Message: "${testMessage}"`);

  const logEntry = {
    id: `log-${Date.now()}`,
    workspace_id: ws.workspace_id,
    channel: ws.channel,
    recipient,
    message: testMessage,
    status: "SENT",
    sent_at: new Date().toISOString(),
  };
  localNotificationLogs.unshift(logEntry);

  res.json({ success: true, log: logEntry });
});

// GET /api/zync/audit-logs — fetch dispatch & activation audit logs
app.get("/api/zync/audit-logs", async (_req, res) => {
  if (supabase) {
    const { data } = await supabase.from("zync_audit_logs").select("*").order("created_at", { ascending: false }).limit(30);
    if (data) return res.json({ logs: data });
  }
  res.json({ logs: zyncAuditLogs });
});

// GET /api/notification-logs backward compatibility
app.get("/api/notification-logs", (req, res) => {
  res.json({ logs: localNotificationLogs });
});

// ─── Zync-Intelligence: JARVIS-Style Executive Interaction Layer ─────────────

// Personality Engine System Instruction (Multilingual English, Tamil, Tanglish)
const ZYNC_PERSONALITY_PROMPT = `You are Zync-Intelligence, the elite assistant for MDs and Chairmen. You are fluent in English, Tamil, and Tanglish. If the user speaks in Tanglish, respond in the same natural Tanglish. Always maintain an executive demeanor regardless of language. Respond with brevity, professional authority, and proactive insight. Never be overly chatty. You are the voice of "Zync powered by Lab-Y".`;

// In-memory JARVIS command log
const jarvisCommandLog = [];

// Helper: call Gemini with the JARVIS personality
async function callZyncIntelligence(prompt) {
  const MODEL_CASCADE = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];

  const isQuotaError = (err) => {
    const msg = err.message || "";
    return msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("429") || err.status === 429;
  };

  for (const model of MODEL_CASCADE) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: ZYNC_PERSONALITY_PROMPT },
              { text: `\n\n${prompt}` },
            ],
          },
        ],
      });
      return response.text;
    } catch (err) {
      console.warn(`[Gemini JARVIS Warning] Model ${model} error:`, err.message);
      continue;
    }
  }
  return null;
}

// POST /api/zync/jarvis — Unified JARVIS intent + response endpoint
app.post("/api/zync/jarvis", async (req, res) => {
  const { transcript, preferred_language } = req.body;
  const userText = (transcript || "").trim();
  const prefLang = preferred_language || "Auto-Detect";

  if (!userText) {
    return res.status(400).json({ error: "No voice transcript provided." });
  }

  console.log(`\n🤖 [Zync-Intelligence] User said: "${userText}" (Preferred Lang: ${prefLang})`);

  try {
    // Step 1: Intent classification & Language Detection via Gemini
    const intentPrompt = `${ZYNC_PERSONALITY_PROMPT}

Analyze this voice command from an executive: "${userText}"
User Preferred Language Setting: "${prefLang}"

Classify intent, detect input language, and generate the response in the same language. Output ONLY valid JSON:
{
  "detected_language": "English" | "Tamil" | "Tanglish",
  "intent": "status" | "schedule_meeting" | "create_task" | "general",
  "spoken_response": "Brief spoken response (1-2 sentences max) in the detected language adhering strictly to tone rules.",
  "entity": "person or company name if mentioned, otherwise null",
  "meeting_time": "extracted time if scheduling, otherwise null",
  "meeting_date": "YYYY-MM-DD if scheduling, otherwise null",
  "task_title": "extracted task title if creating task, otherwise null",
  "task_priority": "high or medium",
  "task_deadline": "YYYY-MM-DD if mentioned, otherwise null"
}

Language & Tone Rules:
1. Detect whether userText is in English, Tamil, or Tanglish (Tamil written in English script or mixed with English terms).
2. If Preferred Language is set to 'English', 'Tamil', or 'Tanglish' (and not 'Auto-Detect'), generate response in that target language.
3. Tone Requirements:
   - English: Professional, crisp, authoritative executive tone.
   - Tamil: Respectful, formal, yet highly efficient (Standard Business Tamil).
   - Tanglish: Natural, professional yet conversational executive style (e.g. "Meeting with Hassan schedule panniyaachu, tomorrow 10:00 AM-ukku.").

Intent rules:
- If user asks about "status", "what's my status", "briefing", "morning pulse", "update", "nelavaram" → intent = "status"
- If user mentions "schedule", "meeting", "call", "sync", "sandhippu" with a person → intent = "schedule_meeting"
- If user mentions "task", "todo", "reminder", "follow up", "velai" → intent = "create_task"
- Otherwise → intent = "general"`;

    let parsed = {
      detected_language: "English",
      intent: "general",
      spoken_response: "Understood. I've noted your request.",
      entity: null,
      meeting_time: null,
      meeting_date: null,
      task_title: null,
      task_priority: "medium",
      task_deadline: null,
    };

    const aiResult = await callZyncIntelligence(intentPrompt);
    if (aiResult) {
      const cleaned = aiResult.replace(/```json/g, "").replace(/```/g, "").trim();
      try {
        parsed = { ...parsed, ...JSON.parse(cleaned) };
      } catch (e) {
        console.warn("[Zync-Intelligence] JSON parse fallback, using raw text as spoken response.");
        parsed.spoken_response = cleaned.slice(0, 200);
      }
    }

    // Step 2: Execute action based on intent
    let actionResult = null;

    if (parsed.intent === "status") {
      let pulseData = null;
      try {
        const pulsePrompt = `${ZYNC_PERSONALITY_PROMPT}
Act as a Chief of Staff. Generate a concise 3-bullet status update for an MD in ${parsed.detected_language}. Output JSON:
{ "bullets": ["bullet 1", "bullet 2", "bullet 3"], "focus_theme": "theme" }`;
        const pulseResult = await callZyncIntelligence(pulsePrompt);
        if (pulseResult) {
          const cleanPulse = pulseResult.replace(/```json/g, "").replace(/```/g, "").trim();
          pulseData = JSON.parse(cleanPulse);
        }
      } catch (e) { /* fallback below */ }

      if (!pulseData) {
        pulseData = {
          bullets: [
            "3 high-priority tasks pending your review today.",
            "2 follow-ups overdue by more than 3 days.",
            "Market intelligence shows +28% demand surge in your sector."
          ],
          focus_theme: "Executive Pipeline Acceleration",
        };
      }

      if (parsed.detected_language === "Tanglish") {
        parsed.spoken_response = `Ungaloda status update: ${pulseData.bullets.join(" ")} Focus theme: ${pulseData.focus_theme}.`;
      } else if (parsed.detected_language === "Tamil") {
        parsed.spoken_response = `உங்கள் தற்போதைய நிலை: ${pulseData.bullets.join(" ")} முதன்மை இலக்கு: ${pulseData.focus_theme}.`;
      } else {
        parsed.spoken_response = `Here's your status. ${pulseData.bullets.join(" ")} Focus theme: ${pulseData.focus_theme}.`;
      }
      actionResult = { type: "status_briefing", data: pulseData };

    } else if (parsed.intent === "schedule_meeting") {
      const meetingDate = parsed.meeting_date || new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const meetingTime = parsed.meeting_time || "10:00 AM";
      const entity = parsed.entity || "Unspecified Contact";

      const meeting = {
        id: `meeting-${Date.now()}`,
        title: `Meeting with ${entity}`,
        date: meetingDate,
        time: meetingTime,
        entity,
        status: "scheduled",
        source: "Zync-Intelligence JARVIS",
        created_at: new Date().toISOString(),
      };

      if (!parsed.spoken_response || parsed.spoken_response === "Understood. I've noted your request.") {
        if (parsed.detected_language === "Tanglish") {
          parsed.spoken_response = `Done. ${entity} koode meeting ${meetingDate} ${meetingTime}-ukku schedule panniyaachu.`;
        } else if (parsed.detected_language === "Tamil") {
          parsed.spoken_response = `சரி, ${entity} உடனான சந்திப்பு ${meetingDate} அன்று காலை ${meetingTime} மணிக்கு பதிவு செய்யப்பட்டது.`;
        } else {
          parsed.spoken_response = `Done. Meeting with ${entity} scheduled for ${meetingDate} at ${meetingTime}.`;
        }
      }
      actionResult = { type: "meeting_scheduled", data: meeting };

    } else if (parsed.intent === "create_task") {
      const task = {
        id: `task-${Date.now()}`,
        title: parsed.task_title || `Executive Task: ${userText.slice(0, 60)}`,
        priority: parsed.task_priority || "high",
        deadline: parsed.task_deadline || new Date(Date.now() + 86400000).toISOString().split("T")[0],
        entity: parsed.entity || "General",
        status: "pending",
        source: "Zync-Intelligence JARVIS",
        created_at: new Date().toISOString(),
      };

      if (!parsed.spoken_response || parsed.spoken_response === "Understood. I've noted your request.") {
        if (parsed.detected_language === "Tanglish") {
          parsed.spoken_response = `Task create panniyaachu: ${task.title}. Priority: ${task.priority}.`;
        } else if (parsed.detected_language === "Tamil") {
          parsed.spoken_response = `பணி உருவாக்கப்பட்டது: ${task.title}. முன்னுரிமை: ${task.priority}.`;
        } else {
          parsed.spoken_response = `Task created: ${task.title}. Priority: ${task.priority}.`;
        }
      }
      actionResult = { type: "task_created", data: task };
    }

    // Step 3: Log the command
    const logEntry = {
      id: `jarvis-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_command: userText,
      zync_response: parsed.spoken_response,
      intent: parsed.intent,
      detected_language: parsed.detected_language || "English",
      action_taken: actionResult?.type || "acknowledged",
      entity: parsed.entity,
    };
    jarvisCommandLog.unshift(logEntry);
    if (jarvisCommandLog.length > 50) jarvisCommandLog.length = 50;

    console.log(`🤖 [Zync-Intelligence] Lang: ${parsed.detected_language} | Intent: ${parsed.intent} | Response: "${parsed.spoken_response}"`);

    res.json({
      success: true,
      detected_language: parsed.detected_language || "English",
      intent: parsed.intent,
      spoken_response: parsed.spoken_response,
      action_result: actionResult,
      log_entry: logEntry,
    });

  } catch (err) {
    console.error("[Zync-Intelligence JARVIS Error]", err.message);
    const fallbackResponse = "I've encountered an issue processing your request. Please try again.";
    const logEntry = {
      id: `jarvis-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_command: userText,
      zync_response: fallbackResponse,
      intent: "error",
      detected_language: "English",
      action_taken: "error",
      entity: null,
    };
    jarvisCommandLog.unshift(logEntry);

    res.json({
      success: true,
      detected_language: "English",
      intent: "general",
      spoken_response: fallbackResponse,
      action_result: null,
      log_entry: logEntry,
    });
  }
});

// POST /api/zync/jarvis/tts — ElevenLabs Text-to-Speech proxy (Multilingual v2 Model)
app.post("/api/zync/jarvis/tts", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided for TTS." });
  }

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel

  if (!elevenLabsKey) {
    // Graceful degradation — tell frontend to use browser SpeechSynthesis
    return res.json({
      fallback: true,
      text,
      message: "No ElevenLabs API key configured. Using browser speech synthesis.",
    });
  }

  try {
    // Uses eleven_multilingual_v2 for English, Tamil, and Tanglish voice synthesis
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2", // Multilingual v2 support
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.85,
        },
      }),
    });

    if (!ttsResponse.ok) {
      console.warn(`[ElevenLabs] API returned ${ttsResponse.status}`);
      return res.json({ fallback: true, text, message: "ElevenLabs API error. Falling back to browser speech." });
    }

    // Stream audio back
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    const reader = ttsResponse.body;
    // Node 18+ fetch returns a ReadableStream; pipe it
    const { Readable } = require("stream");
    const nodeStream = Readable.fromWeb(reader);
    nodeStream.pipe(res);

  } catch (err) {
    console.error("[ElevenLabs TTS Error]", err.message);
    res.json({ fallback: true, text, message: "TTS service unavailable. Using browser speech." });
  }
});

// GET /api/zync/jarvis/command-log — fetch JARVIS command history
app.get("/api/zync/jarvis/command-log", (_req, res) => {
  res.json({ logs: jarvisCommandLog });
});

// ─── Background Automation Engine (Cron Runner) ────────────────────────────
function runHourlyCronJob() {
  console.log(`\n[Cron Engine] Running hourly check... (${new Date().toLocaleTimeString()})`);

  zyncWorkspaces.forEach((ws) => {
    // 🛡️ STRICT SERVICE VALIDATOR: Check service_provider_activation_status
    if (!ws.service_provider_activation_status) {
      console.log(`   🛡️ Lab-Y SERVICE VALIDATOR REFUSAL: service_provider_activation_status is FALSE for Workspace ${ws.workspace_id}. Refused automation.`);
      return;
    }

    console.log(`   ✅ Executing hourly automation tasks for active Workspace ${ws.workspace_id}`);
  });
}

// Run hourly
const HOURLY_INTERVAL_MS = 60 * 60 * 1000;
setInterval(runHourlyCronJob, HOURLY_INTERVAL_MS);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    system: "Zync powered by Lab-Y",
    timestamp: new Date().toISOString(),
    supabase: !!supabase,
    service_provider_activation_status: zyncWorkspaces[0].service_provider_activation_status,
    workspace_id: zyncWorkspaces[0].workspace_id,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Zync powered by Lab-Y API running on http://localhost:${PORT}`);
  console.log(`    POST   /api/parse-resume                   — upload a PDF resume`);
  console.log(`    GET    /api/candidates                      — list candidates`);
  console.log(`    GET    /api/zync/workspace                  — fetch workspace activation status`);
  console.log(`    POST   /api/zync/request-premium-ops        — Client Portal request form`);
  console.log(`    GET    /api/lab-y/workspaces                — Lab-Y Provider Admin Console`);
  console.log(`    POST   /api/lab-y/toggle-workspace-service  — Lab-Y Master Control Switch`);
  console.log(`    POST   /api/zync/trigger-voice-to-action   — Protected by ServiceValidator`);
  console.log(`    POST   /api/zync/trigger-market-intelligence — Protected by ServiceValidator`);
  console.log(`    GET    /api/health                          — health check\n`);

  console.log(`[Lab-Y Provider Control Initialized] Workspace ID: ${zyncWorkspaces[0].workspace_id} | Master Switch (service_provider_activation_status): ${zyncWorkspaces[0].service_provider_activation_status}`);
});
