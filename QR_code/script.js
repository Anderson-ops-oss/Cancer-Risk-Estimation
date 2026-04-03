const ANALYZE_API_ENDPOINT = "/api/analyze-risk";

const steps = [
  {
    title: "Demographics & Biometrics",
    questions: [
      {
        id: "age",
        text: "What is your age group?",
        type: "select",
        options: ["Under 20", "20-35", "36-50", "51-65", "Over 65"],
        required: true,
      },
      {
        id: "gender",
        text: "What is your gender?",
        type: "radio",
        options: ["Male", "Female"],
        required: true,
      },
      {
        id: "bmi",
        text: "What is your BMI? (Weight kg / Height m²)",
        type: "number",
        placeholder: "e.g. 24",
        required: true,
      },
      {
        id: "bloodType",
        text: "What is your blood type?",
        type: "select",
        options: ["A", "B", "AB", "O", "Unknown"],
        required: false,
      },
    ],
  },
  {
    title: "Lifestyle Factors",
    questions: [
      {
        id: "smoking",
        text: "Smoking status?",
        type: "select",
        options: [
          "Never",
          "Quit (<10 yrs ago)",
          "Quit (>10 yrs ago)",
          "Occasional",
          "Regular (>1 pack/day)",
        ],
        required: true,
      },
      {
        id: "secondhandSmoke",
        text: "Exposure to secondhand smoke?",
        type: "radio",
        options: ["Rarely", "Occasionally", "Frequently"],
        required: true,
      },
      {
        id: "alcohol",
        text: "Alcohol consumption frequency?",
        type: "select",
        options: ["Never", "Socially/Occasionally", "3-4 times/week", "Daily"],
        required: true,
      },
      {
        id: "diet",
        text: "Dietary habits lean towards?",
        type: "select",
        options: [
          "Balanced",
          "High Salt/Pickled",
          "Red/Processed Meat",
          "Fried Foods",
          "Low Fruit/Veg Intake",
        ],
        required: true,
      },
      {
        id: "exercise",
        text: "Physical exercise frequency?",
        type: "select",
        options: ["Sedentary", "Light (1-2 times/week)", "Active (3+ times/week)"],
        required: true,
      },
      {
        id: "sleep",
        text: "Sleep quality?",
        type: "radio",
        options: ["Good/Regular", "Irregular/Late", "Chronic Insomnia"],
        required: true,
      },
    ],
  },
  {
    title: "Family History",
    questions: [
      {
        id: "familyHistory",
        text: "Immediate family members with cancer history?",
        type: "radio",
        options: ["None", "Yes, 1 member", "Yes, 2 or more"],
        required: true,
      },
      {
        id: "familyOnset",
        text: "If yes, approximate age of onset?",
        type: "select",
        options: ["No history", "Before 50 (Early onset)", "After 50"],
        required: false,
      },
    ],
  },
  {
    title: "Medical History",
    questions: [
      {
        id: "viruses",
        text: "History of viral infections? (Select all that apply)",
        type: "checkbox",
        options: ["Hepatitis B/C", "H. pylori", "HPV", "None/Unknown"],
        required: false,
      },
      {
        id: "hormones",
        text: "Long-term hormone use or radiation therapy?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "screening",
        text: "Last comprehensive cancer screening?",
        type: "select",
        options: ["Within 1 year", "1-3 years ago", ">3 years ago", "Never"],
        required: true,
      },
    ],
  },
  {
    title: "Exposures & Symptoms",
    questions: [
      {
        id: "occupational",
        text: "Occupational exposure to carcinogens?",
        type: "radio",
        options: ["Yes, Long-term", "Yes, Occasional", "No"],
        required: true,
      },
      {
        id: "weightLoss",
        text: "Unexplained weight loss (>5kg) recently?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "symptoms",
        text: "Persistent symptoms (cough, lumps, difficulty swallowing)?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "bowel",
        text: "Changes in bowel or bladder habits?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
];

const state = {
  currentStep: 0,
  isProcessing: false,
  processingProgress: 0,
  processingStep: "",
  error: "",
  result: null,
  answers: {
    viruses: [],
  },
};

const app = document.getElementById("app");

function render() {
  if (state.isProcessing) {
    renderProcessing();
    return;
  }

  if (state.result) {
    renderResult();
    return;
  }

  renderForm();
}

function renderForm() {
  const progressPercent = Math.round((state.currentStep / steps.length) * 100);
  const step = steps[state.currentStep];

  app.innerHTML = `
    <div class="progress-meta">
      <span>Step ${state.currentStep + 1} of ${steps.length}</span>
      <span>${progressPercent}% Completed</span>
    </div>
    <div class="progress-track">
      <div class="progress-bar" style="width: ${progressPercent}%"></div>
    </div>
    <div class="step-title">${escapeHtml(step.title)}</div>
    <form id="risk-form" class="question-list" novalidate></form>
    ${
      state.error
        ? `<div class="error-box">${escapeHtml(state.error)}</div>`
        : ""
    }
  `;

  const form = document.getElementById("risk-form");
  const template = document.getElementById("question-template");

  step.questions.forEach((question) => {
    const fragment = template.content.cloneNode(true);
    const label = fragment.querySelector(".question-label");
    const inputWrap = fragment.querySelector(".question-input");
    label.innerHTML = `
      ${escapeHtml(question.text)}
      ${question.required ? '<span class="required">*</span>' : ""}
    `;
    inputWrap.appendChild(renderQuestionInput(question));
    form.appendChild(fragment);
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.innerHTML = `
    <button type="button" id="back-button" class="button button-secondary" ${
      state.currentStep === 0 ? "disabled" : ""
    }>Back</button>
    <button type="submit" class="button button-primary">${
      state.currentStep === steps.length - 1 ? "Analyze Risk" : "Next Step"
    }</button>
  `;
  form.appendChild(actions);

  form.addEventListener("submit", handleNextStep);
  document.getElementById("back-button").addEventListener("click", handlePrevStep);
}

function renderQuestionInput(question) {
  if (question.type === "select") {
    const select = document.createElement("select");
    select.name = question.id;
    select.required = question.required;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = !state.answers[question.id];
    placeholder.textContent = "Please select";
    select.appendChild(placeholder);

    question.options.forEach((option) => {
      const node = document.createElement("option");
      node.value = option;
      node.textContent = option;
      node.selected = state.answers[question.id] === option;
      select.appendChild(node);
    });

    return select;
  }

  if (question.type === "number") {
    const input = document.createElement("input");
    input.type = "number";
    input.name = question.id;
    input.required = question.required;
    input.placeholder = question.placeholder || "";
    input.value = state.answers[question.id] || "";
    return input;
  }

  const group = document.createElement("div");
  group.className = "choice-group";

  question.options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "choice-card";

    const input = document.createElement("input");
    input.type = question.type === "checkbox" ? "checkbox" : "radio";
    input.name = question.id;
    input.value = option;
    input.checked =
      question.type === "checkbox"
        ? (state.answers[question.id] || []).includes(option)
        : state.answers[question.id] === option;

    const text = document.createElement("span");
    text.textContent = option;

    label.appendChild(input);
    label.appendChild(text);
    group.appendChild(label);
  });

  return group;
}

function renderProcessing() {
  app.innerHTML = `
    <div class="processing-state">
      <div class="spinner-wrap">
        <div class="spinner-track"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-core">AI</div>
      </div>
      <h2 class="processing-title">AI Analyzing Profile</h2>
      <p class="processing-text">${escapeHtml(state.processingStep)}</p>
      <div class="loading-bar">
        <div class="loading-fill" style="width: ${state.processingProgress}%"></div>
      </div>
      <div class="loading-percent">${Math.round(state.processingProgress)}% Complete</div>
      ${
        state.error
          ? `<div class="error-box">${escapeHtml(state.error)}</div>`
          : ""
      }
    </div>
  `;
}

function renderResult() {
  const result = normalizeResult(state.result);
  const riskText = riskLabel(result.overallRisk);

  app.innerHTML = `
    <div class="result-state">
      <div class="result-header">
        <div class="risk-badge ${result.overallRisk}">${escapeHtml(riskText)}</div>
        <div>
          <h2 class="result-title">Assessment Complete</h2>
          <p class="result-summary">${escapeHtml(result.summary)}</p>
        </div>
      </div>

      <div class="results-grid">
        ${result.bodyPartFindings
          .map(
            (item) => `
              <article class="finding-card">
                <div class="finding-header">
                  <h3 class="finding-title">${escapeHtml(item.bodyPart)}</h3>
                  <span class="chip ${item.riskLevel}">${escapeHtml(
              riskLabel(item.riskLevel)
            )}</span>
                </div>
                <ul class="finding-points">
                  ${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
                </ul>
              </article>
            `
          )
          .join("")}
      </div>

      <p class="footnote">
        This AI-generated assessment is for screening support only and should not replace clinical diagnosis.
      </p>

      <div class="result-actions">
        <button type="button" id="restart-button" class="button button-ghost">Start Over</button>
      </div>
    </div>
  `;

  document.getElementById("restart-button").addEventListener("click", resetForm);
}

function handleNextStep(event) {
  event.preventDefault();
  state.error = "";

  const step = steps[state.currentStep];
  const formData = collectStepAnswers(step);
  const validationError = validateStep(step, formData);

  if (validationError) {
    state.error = validationError;
    render();
    return;
  }

  Object.assign(state.answers, formData);

  if (state.currentStep < steps.length - 1) {
    state.currentStep += 1;
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
    return;
  }

  analyzeRisk();
}

function handlePrevStep() {
  if (state.currentStep === 0) {
    return;
  }

  state.error = "";
  state.currentStep -= 1;
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function collectStepAnswers(step) {
  const form = document.getElementById("risk-form");
  const nextAnswers = {};

  step.questions.forEach((question) => {
    if (question.type === "checkbox") {
      nextAnswers[question.id] = Array.from(
        form.querySelectorAll(`input[name="${question.id}"]:checked`)
      ).map((node) => node.value);
      return;
    }

    if (question.type === "radio") {
      const checked = form.querySelector(`input[name="${question.id}"]:checked`);
      nextAnswers[question.id] = checked ? checked.value : "";
      return;
    }

    const field = form.elements[question.id];
    nextAnswers[question.id] = field ? field.value.trim() : "";
  });

  return nextAnswers;
}

function validateStep(step, formData) {
  for (const question of step.questions) {
    if (!question.required) {
      continue;
    }

    const value = formData[question.id];
    if (question.type === "checkbox" && (!Array.isArray(value) || value.length === 0)) {
      return `Please answer "${question.text}".`;
    }

    if ((question.type === "radio" || question.type === "select" || question.type === "number") && !value) {
      return `Please answer "${question.text}".`;
    }
  }

  return "";
}

async function analyzeRisk() {
  state.isProcessing = true;
  state.processingProgress = 8;
  state.processingStep = "Preparing questionnaire payload...";
  state.error = "";
  render();

  const progressSteps = [
    { progress: 18, text: "Formatting patient profile for structured analysis..." },
    { progress: 37, text: "Sending request to OpenRouter..." },
    { progress: 58, text: "Model is evaluating systemic and organ-specific signals..." },
    { progress: 78, text: "Validating JSON response format..." },
    { progress: 92, text: "Preparing final assessment view..." },
  ];

  let progressIndex = 0;
  const interval = window.setInterval(() => {
    if (progressIndex >= progressSteps.length) {
      return;
    }
    state.processingProgress = progressSteps[progressIndex].progress;
    state.processingStep = progressSteps[progressIndex].text;
    renderProcessing();
    progressIndex += 1;
  }, 1200);

  try {
    const response = await fetch(ANALYZE_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: getOrCreateSessionId(),
        questionnaire: formatAnswersForModel(state.answers),
      }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      throw new Error(`OpenRouter request failed with status ${response.status}. ${rawError}`);
    }

    state.processingProgress = 96;
    state.processingStep = "Reading model output...";
    renderProcessing();

    const payload = await response.json();
    state.result = normalizeResult(payload.result);
    state.processingProgress = 100;
    state.processingStep = "Assessment ready.";
    state.isProcessing = false;
    state.error = "";
    window.clearInterval(interval);
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
  } catch (error) {
    window.clearInterval(interval);
    state.isProcessing = false;
    state.error = error instanceof Error ? error.message : "Unknown error during AI analysis.";
    render();
  }
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

function buildUserPrompt(answers) {
  return [
    "Analyze this cancer screening questionnaire and produce the required JSON.",
    "The output is displayed directly to the user, so it must be clear, calm, and structured.",
    "",
    "Questionnaire answers:",
    JSON.stringify(formatAnswersForModel(answers), null, 2),
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

function formatAnswersForModel(answers) {
  return {
    ageGroup: answers.age || "Unknown",
    gender: answers.gender || "Unknown",
    bmi: answers.bmi || "Unknown",
    bloodType: answers.bloodType || "Unknown",
    smokingStatus: answers.smoking || "Unknown",
    secondhandSmoke: answers.secondhandSmoke || "Unknown",
    alcoholUse: answers.alcohol || "Unknown",
    dietPattern: answers.diet || "Unknown",
    exerciseLevel: answers.exercise || "Unknown",
    sleepQuality: answers.sleep || "Unknown",
    familyHistory: answers.familyHistory || "Unknown",
    familyOnsetAge: answers.familyOnset || "Unknown",
    viralInfections: Array.isArray(answers.viruses) && answers.viruses.length > 0 ? answers.viruses : ["None reported"],
    hormoneOrRadiationHistory: answers.hormones || "Unknown",
    lastScreening: answers.screening || "Unknown",
    occupationalExposure: answers.occupational || "Unknown",
    unexplainedWeightLoss: answers.weightLoss || "Unknown",
    persistentSymptoms: answers.symptoms || "Unknown",
    bowelOrBladderChanges: answers.bowel || "Unknown",
  };
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
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

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

function riskLabel(level) {
  if (level === "low") {
    return "Low Risk";
  }

  if (level === "moderate") {
    return "Moderate Risk";
  }

  return "High Risk";
}

function resetForm() {
  state.currentStep = 0;
  state.isProcessing = false;
  state.processingProgress = 0;
  state.processingStep = "";
  state.error = "";
  state.result = null;
  state.answers = {
    viruses: [],
  };
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function getOrCreateSessionId() {
  const storageKey = "lifescan-risk-session-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const sessionId =
    window.crypto?.randomUUID?.() ||
    `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(storageKey, sessionId);
  return sessionId;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

render();
