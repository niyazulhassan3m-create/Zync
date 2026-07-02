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

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: !!supabase,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Resume Processor API running on http://localhost:${PORT}`);
  console.log(`    POST   /api/parse-resume     — upload a PDF resume`);
  console.log(`    GET    /api/candidates        — list all candidates`);
  console.log(`    POST   /api/candidates        — save a candidate`);
  console.log(`    DELETE /api/candidates/:id   — remove a candidate`);
  console.log(`    GET    /api/health            — health check\n`);
});
