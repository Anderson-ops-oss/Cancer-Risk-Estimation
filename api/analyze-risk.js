import { sql } from "@vercel/postgres";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const openRouterModel = process.env.OPENROUTER_MODEL;
  const siteUrl = process.env.OPENROUTER_SITE_URL || "";
  const siteName = process.env.OPENROUTER_SITE_NAME || "";

  if (!openRouterApiKey || !openRouterModel) {
    return res.status(500).json({
      error: "Missing OPENROUTER_API_KEY or OPENROUTER_MODEL environment variables.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const questionnaire = body?.questionnaire;
    const sessionId = sanitizeSessionId(body?.sessionId);

    if (!questionnaire || typeof questionnaire !== "object") {
      return res.status(400).json({ error: "Invalid questionnaire payload." });
    }

    await ensureTable();

    const openRouterResponse = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        ...(siteUrl ? { "HTTP-Referer": siteUrl } : {}),
        ...(siteName ? { "X-Title": siteName } : {}),
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: buildUserPrompt(questionnaire),
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!openRouterResponse.ok) {
      const rawError = await openRouterResponse.text();
      throw new Error(`OpenRouter request failed with status ${openRouterResponse.status}. ${rawError}`);
    }

    const payload = await openRouterResponse.json();
    const text = payload?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Model response was empty.");
    }

    const parsed = parseModelJson(text);
    const result = normalizeResult(parsed);

    const userAgent = req.headers["user-agent"] || "";
    const forwardedFor = req.headers["x-forwarded-for"] || "";
    const clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : String(forwardedFor).split(",")[0].trim();

    const insertResult = await sql`
      INSERT INTO cancer_risk_submissions (
        session_id,
        questionnaire,
        ai_result,
        overall_risk,
        user_agent,
        client_ip
      ) VALUES (
        ${sessionId},
        ${JSON.stringify(questionnaire)}::jsonb,
        ${JSON.stringify(result)}::jsonb,
        ${result.overallRisk},
        ${userAgent},
        ${clientIp}
      )
      RETURNING id, created_at
    `;

    return res.status(200).json({
      ok: true,
      submissionId: insertResult.rows[0]?.id ?? null,
      createdAt: insertResult.rows[0]?.created_at ?? null,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error.",
    });
  }
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS cancer_risk_submissions (
      id SERIAL PRIMARY KEY,
      session_id TEXT,
      questionnaire JSONB NOT NULL,
      ai_result JSONB NOT NULL,
      overall_risk TEXT NOT NULL,
      user_agent TEXT,
      client_ip TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function sanitizeSessionId(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.slice(0, 120);
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function buildSystemPrompt() {
  return [
    "You are a cancer risk screening analysis assistant.",
    "You are not diagnosing cancer. You are estimating screening risk from questionnaire inputs only.",
    "Return only valid JSON with no markdown, no code fences, and no extra commentary.",
    "Use cautious, medically responsible wording.",
    "Base your reasoning only on the supplied questionnaire data.",
    "Do not mention unavailable tests, hidden data, or prior records.",
    "The JSON schema is mandatory.",
    "{",
    '  "overallRisk": "low | moderate | high",',
    '  "summary": "2-4 sentence concise summary for the user.",',
    '  "bodyPartFindings": [',
    "    {",
    '      "bodyPart": "string, e.g. Lung / Digestive Tract / Liver / Breast / Reproductive System / Urinary System / General",',
    '      "riskLevel": "low | moderate | high",',
    '      "points": ["1-3 short bullet points written for a layperson"]',
    "    }",
    "  ]",
    "}",
    "Requirements:",
    "1. overallRisk must be exactly one of: low, moderate, high.",
    "2. summary must be plain English, concise, and consistent with the questionnaire.",
    "3. bodyPartFindings must contain 3 to 6 body-part sections.",
    "4. Each points array must have 1 to 3 items.",
    "5. Each bodyPart should be a clinically sensible screening grouping, not too granular.",
    "6. If data is weak or mixed, say so cautiously in the points rather than overstating certainty.",
    "7. No fields other than overallRisk, summary, bodyPartFindings.",
  ].join("\n");
}

function buildUserPrompt(questionnaire) {
  return [
    "Analyze this cancer screening questionnaire and produce the required JSON.",
    "The output is displayed directly to the user, so it must be clear, calm, and structured.",
    "",
    "Questionnaire answers:",
    JSON.stringify(questionnaire, null, 2),
    "",
    "Interpretation guidance:",
    "- Age, smoking, secondhand smoke, symptoms, weight loss, and family history should influence overall risk materially.",
    "- Viral infection history may map to organ systems such as liver, stomach, or cervical/anogenital pathways when relevant.",
    "- If screening has been absent for a long time, that can increase concern but should not be treated as evidence of disease.",
    "- Persistent symptoms should raise concern for appropriate body systems, but remain probabilistic.",
    "- Keep the summary useful for a non-clinical reader.",
    "",
    "Return only JSON.",
  ].join("\n");
}

function parseModelJson(rawText) {
  const trimmed = rawText.trim();
  const cleaned = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Model did not return valid JSON.");
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (secondError) {
      throw new Error("Model returned malformed JSON.");
    }
  }
}

function normalizeResult(result) {
  if (!result || typeof result !== "object") {
    throw new Error("AI result is missing.");
  }

  const overallRisk = normalizeRisk(result.overallRisk);
  const summary = typeof result.summary === "string" ? result.summary.trim() : "";
  const bodyPartFindings = Array.isArray(result.bodyPartFindings)
    ? result.bodyPartFindings
        .map((item) => ({
          bodyPart:
            typeof item?.bodyPart === "string" && item.bodyPart.trim()
              ? item.bodyPart.trim()
              : "General",
          riskLevel: normalizeRisk(item?.riskLevel),
          points: Array.isArray(item?.points)
            ? item.points
                .filter((point) => typeof point === "string" && point.trim())
                .map((point) => point.trim())
                .slice(0, 3)
            : [],
        }))
        .filter((item) => item.points.length > 0)
    : [];

  if (!summary) {
    throw new Error("AI result is missing summary.");
  }

  if (bodyPartFindings.length === 0) {
    throw new Error("AI result is missing bodyPartFindings.");
  }

  return {
    overallRisk,
    summary,
    bodyPartFindings,
  };
}

function normalizeRisk(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "low") {
    return "low";
  }

  if (normalized === "moderate" || normalized === "medium") {
    return "moderate";
  }

  if (normalized === "high") {
    return "high";
  }

  throw new Error(`Unsupported risk level: ${value}`);
}
