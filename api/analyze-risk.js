import { existsSync, readFileSync } from "node:fs";
import { sql } from "@vercel/postgres";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const deepSeekApiKey = getEnvValue("DEEPSEEK_API_KEY");

  if (!deepSeekApiKey) {
    return res.status(500).json({
      error: "Missing DEEPSEEK_API_KEY environment variable.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const questionnaire = body?.questionnaire;

    if (!questionnaire || typeof questionnaire !== "object") {
      return res.status(400).json({ error: "Invalid questionnaire payload." });
    }

    const deepSeekResponse = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deepSeekApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
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

    if (!deepSeekResponse.ok) {
      const rawError = await deepSeekResponse.text();
      throw new Error(`DeepSeek request failed with status ${deepSeekResponse.status}. ${rawError}`);
    }

    const payload = await deepSeekResponse.json();
    const text = payload?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Model response was empty.");
    }

    const parsed = parseModelJson(text);
    const result = normalizeResult(parsed);

    const savedSubmission = await saveSubmissionIfPossible({
      questionnaire,
    });

    return res.status(200).json({
      ok: true,
      submissionId: savedSubmission.id,
      createdAt: savedSubmission.createdAt,
      persistedToDatabase: savedSubmission.persisted,
      databaseWarning: savedSubmission.warning,
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
      questionnaire JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE cancer_risk_submissions
    ADD COLUMN IF NOT EXISTS questionnaire JSONB
  `;

  await sql`
    ALTER TABLE cancer_risk_submissions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;

  await sql`
    ALTER TABLE cancer_risk_submissions
    ALTER COLUMN questionnaire SET NOT NULL
  `;

  try {
    await sql`
      ALTER TABLE cancer_risk_submissions
      ALTER COLUMN ai_result DROP NOT NULL
    `;
  } catch (error) {
    // Older or freshly created tables may not have this legacy column.
  }

  try {
    await sql`
      ALTER TABLE cancer_risk_submissions
      ALTER COLUMN overall_risk DROP NOT NULL
    `;
  } catch (error) {
    // Older or freshly created tables may not have this legacy column.
  }
}

async function saveSubmissionIfPossible({ questionnaire }) {
  if (!process.env.POSTGRES_URL) {
    return {
      id: null,
      createdAt: null,
      persisted: false,
      warning: "POSTGRES_URL is not configured. Analysis completed without database persistence.",
    };
  }

  try {
    await ensureTable();

    const insertResult = await sql`
      INSERT INTO cancer_risk_submissions (
        questionnaire
      ) VALUES (
        ${JSON.stringify(questionnaire)}::jsonb
      )
      RETURNING id, created_at
    `;

    return {
      id: insertResult.rows[0]?.id ?? null,
      createdAt: insertResult.rows[0]?.created_at ?? null,
      persisted: true,
      warning: null,
    };
  } catch (error) {
    return {
      id: null,
      createdAt: null,
      persisted: false,
      warning:
        error instanceof Error
          ? `Database persistence failed, but analysis still completed. ${error.message}`
          : "Database persistence failed, but analysis still completed.",
    };
  }
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getEnvValue(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  const localEnv = readLocalEnvFile(".env.local");
  if (localEnv[name]) {
    return localEnv[name];
  }

  const defaultEnv = readLocalEnvFile(".env");
  if (defaultEnv[name]) {
    return defaultEnv[name];
  }

  return "";
}

function readLocalEnvFile(filename) {
  try {
    const fileUrl = new URL(`../${filename}`, import.meta.url);
    if (!existsSync(fileUrl)) {
      return {};
    }

    const content = readFileSync(fileUrl, "utf8");
    return parseDotEnv(content);
  } catch (error) {
    return {};
  }
}

function parseDotEnv(content) {
  return content.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return acc;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return acc;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    acc[key] = value;
    return acc;
  }, {});
}

function buildSystemPrompt() {
  return [
    "You are generating an educational cancer-awareness report for a consumer-facing health platform.",
    "",
    "The experience is NOT diagnostic.",
    "It must NOT diagnose cancer, estimate a percentage probability of cancer, or claim that a person has cancer.",
    'It must NOT use absolute language such as "you are high risk for cancer" or "you likely have cancer."',
    'Use softer, educational language such as "signals worth paying attention to," "areas to keep on the radar," and "topics to discuss with a clinician."',
    "",
    "Your task:",
    "1. Read the questionnaire answers.",
    "2. Identify the most relevant cancer-related lifestyle signals, family-history signals, infection-history signals, exposure signals, screening-readiness gaps, and symptom flags.",
    "3. Produce a structured, plain-English result that is cautious, useful, and cancer-oriented.",
    "4. Return JSON only, with no markdown and no extra commentary.",
    "",
    "Hard rules:",
    "- Educational only, not a diagnosis.",
    "- No percentages, no survival estimates, no staging language.",
    "- Do not invent medical history that is not present in the answers.",
    "- If symptoms are reported, separate symptom triage from prevention guidance.",
    '- If guideline-based screening timing depends on country, say "local guidelines vary."',
    '- If the user may qualify for lung-screening discussion because of age and smoking history, say "may want to discuss low-dose CT screening with a clinician," not "should get a scan now."',
    "- If family history is strong or early-onset, mention that earlier screening or genetic-risk discussion may be worth reviewing with a clinician.",
    "- Keep the tone calm, non-alarmist, and consumer-friendly.",
    "- Output must be valid JSON matching the schema below.",
    "",
    "Input:",
    "You will receive a JSON object that includes user_answers and derived_fields.",
    "",
    "Output schema:",
    "{",
    '  "tool_name": "Cancer Awareness Check",',
    '  "version": "1.0",',
    '  "educational_only": true,',
    '  "summary_level": "FEW_SIGNALS | SOME_SIGNALS | SEVERAL_SIGNALS",',
    '  "headline": "string, max 120 chars",',
    '  "summary_text": "string, 2-4 sentences",',
    '  "key_signals": [',
    "    {",
    '      "signal": "string",',
    '      "why_it_matters": "string",',
    '      "based_on_answers": ["field_id_1", "field_id_2"]',
    "    }",
    "  ],",
    '  "areas_on_radar": [',
    "    {",
    '      "area": "Lung | Colorectal | Stomach | Liver | Cervix | Breast | Prostate | Skin | General prevention",',
    '      "why_on_radar": "string",',
    '      "confidence": "low | moderate"',
    "    }",
    "  ],",
    '  "screening_conversation_starters": [',
    "    {",
    '      "topic": "string",',
    '      "timing_label": "review now | within 12 months | follow routine local guidance",',
    '      "reason": "string"',
    "    }",
    "  ],",
    '  "lifestyle_priorities": [',
    "    {",
    '      "priority": "string",',
    '      "action": "string",',
    '      "why_this_helps": "string"',
    "    }",
    "  ],",
    '  "symptom_triage": {',
    '    "level": "none | soon | prompt",',
    '    "message": "string"',
    "  },",
    '  "disclaimer": "Educational only. Not a diagnosis. Seek medical advice for symptoms, concerns, or personalised screening decisions."',
    "}",
    "",
    "Interpretation guidance:",
    "- FEW_SIGNALS: mostly favorable pattern, no major symptom flag, no strong family-history flag, and no major screening gap.",
    "- SOME_SIGNALS: a mixed pattern with a few moderate concerns or one notable gap.",
    "- SEVERAL_SIGNALS: multiple moderate concerns, a strong single risk signal, a strong family-history pattern, or a relevant symptom/overdue-screening combination.",
    "- Lung: current smoking, heavier former smoking, major secondhand smoke, or occupational inhalation exposure.",
    "- Colorectal: age 45+, processed meat pattern, low fruit/veg pattern, obesity, inactivity, family history, overdue colorectal screening.",
    "- Stomach: frequent salt-preserved or pickled foods, known H. pylori history, stomach cancer family history.",
    "- Liver: hepatitis B or C history, heavy alcohol pattern.",
    "- Cervix: cervix present, screening gap, HPV vaccination gap, relevant age range.",
    "- Breast: breasts present, age-based screening gap, relevant family history.",
    "- Prostate: prostate present, age 55+, screening discussion gap.",
    "- Skin: repeated severe sunburns or tanning-bed history.",
    "",
    "Screening conversation guidance:",
    "- Breast: for many average-risk women, routine screening discussions often start around age 40; local guidance varies.",
    "- Colorectal: routine screening discussions commonly start around age 45 for average-risk adults; local guidance varies.",
    "- Lung: annual low-dose CT discussion may be relevant for adults roughly age 50 to 80 with a 20 pack-year history who currently smoke or quit within the last 15 years.",
    "- Cervical: screening depends on age and whether the person has a cervix; local guidance varies.",
    "- Prostate: PSA screening is usually a shared decision rather than a universal rule; local guidance varies.",
    "",
    "Style rules:",
    "- Be specific but brief.",
    "- Do not exceed 5 key_signals.",
    "- Do not exceed 4 areas_on_radar.",
    "- Do not exceed 5 screening_conversation_starters.",
    "- Do not exceed 5 lifestyle_priorities.",
    "- Every explanation must map back to the user's actual answers.",
    '- Prefer "consider discussing," "may want to review," and "worth keeping on the radar" over directive language.',
  ].join("\n");
}

function buildUserPrompt(questionnaire) {
  return [
    "Analyze this cancer awareness questionnaire input and produce the required JSON report.",
    "",
    "Structured input:",
    JSON.stringify(questionnaire, null, 2),
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

  const summaryLevel = normalizeSummaryLevel(result.summary_level);
  const summaryText = readNonEmptyString(result.summary_text, "");

  if (!summaryText) {
    throw new Error("AI result is missing summary_text.");
  }

  return {
    toolName: readNonEmptyString(result.tool_name, "Cancer Awareness Check"),
    version: readNonEmptyString(result.version, "1.0"),
    educationalOnly: result.educational_only !== false,
    summaryLevel,
    headline: readNonEmptyString(result.headline, "Cancer awareness check"),
    summaryText,
    keySignals: normalizeKeySignals(result.key_signals),
    areasOnRadar: normalizeAreasOnRadar(result.areas_on_radar),
    screeningConversationStarters: normalizeScreeningStarters(result.screening_conversation_starters),
    lifestylePriorities: normalizeLifestylePriorities(result.lifestyle_priorities),
    symptomTriage: normalizeSymptomTriage(result.symptom_triage),
    disclaimer: readNonEmptyString(
      result.disclaimer,
      "Educational only. Not a diagnosis. Seek medical advice for symptoms, concerns, or personalised screening decisions."
    ),
  };
}

function normalizeSummaryLevel(value) {
  const normalized = String(value || "").trim().toUpperCase();

  if (normalized === "FEW_SIGNALS" || normalized === "SOME_SIGNALS" || normalized === "SEVERAL_SIGNALS") {
    return normalized;
  }

  throw new Error(`Unsupported summary_level: ${value}`);
}

function normalizeKeySignals(value) {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          signal: readNonEmptyString(item?.signal, ""),
          whyItMatters: readNonEmptyString(item?.why_it_matters, ""),
          basedOnAnswers: Array.isArray(item?.based_on_answers)
            ? item.based_on_answers.filter((entry) => typeof entry === "string" && entry.trim()).slice(0, 5)
            : [],
        }))
        .filter((item) => item.signal && item.whyItMatters)
        .slice(0, 5)
    : [];
}

function normalizeAreasOnRadar(value) {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          area: readNonEmptyString(item?.area, ""),
          whyOnRadar: readNonEmptyString(item?.why_on_radar, ""),
          confidence: normalizeConfidence(item?.confidence),
        }))
        .filter((item) => item.area && item.whyOnRadar)
        .slice(0, 4)
    : [];
}

function normalizeScreeningStarters(value) {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          topic: readNonEmptyString(item?.topic, ""),
          timingLabel: readNonEmptyString(item?.timing_label, ""),
          reason: readNonEmptyString(item?.reason, ""),
        }))
        .filter((item) => item.topic && item.timingLabel && item.reason)
        .slice(0, 5)
    : [];
}

function normalizeLifestylePriorities(value) {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          priority: readNonEmptyString(item?.priority, ""),
          action: readNonEmptyString(item?.action, ""),
          whyThisHelps: readNonEmptyString(item?.why_this_helps, ""),
        }))
        .filter((item) => item.priority && item.action && item.whyThisHelps)
        .slice(0, 5)
    : [];
}

function normalizeSymptomTriage(value) {
  const level = normalizeSymptomLevel(value?.level);
  const fallbackMessage =
    level === "none"
      ? "No major recent symptom flag was identified from the questionnaire."
      : "Some recent symptoms may be worth discussing with a clinician.";

  return {
    level,
    message: readNonEmptyString(value?.message, fallbackMessage),
  };
}

function normalizeConfidence(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "moderate" ? "moderate" : "low";
}

function normalizeSymptomLevel(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "none" || normalized === "soon" || normalized === "prompt") {
    return normalized;
  }

  return "none";
}

function readNonEmptyString(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }
