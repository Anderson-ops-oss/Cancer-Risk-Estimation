const ANALYZE_API_ENDPOINT = "/api/analyze-risk";

const steps = [
  {
    title: "About You",
    questions: [
      {
        id: "age_group",
        text: "What is your age group?",
        type: "select",
        options: ["Under 25", "25-34", "35-44", "45-54", "55-64", "65-74", "75+"],
        required: true,
      },
      {
        id: "sex_at_birth",
        text: "What sex were you assigned at birth?",
        type: "select",
        options: ["Female", "Male", "Intersex / another variation", "Prefer not to say"],
        required: true,
      },
      {
        id: "organs_relevant",
        text: "To personalize your screening reminders, which of these are relevant to you?",
        type: "checkbox",
        options: ["Cervix", "Breasts", "Prostate", "None / not sure / prefer not to say"],
        required: false,
        exclusiveOptions: ["None / not sure / prefer not to say"],
      },
      {
        id: "height_cm",
        text: "Height (cm)",
        type: "number",
        placeholder: "120-230",
        required: false,
        min: 120,
        max: 230,
        step: "1",
      },
      {
        id: "weight_kg",
        text: "Weight (kg)",
        type: "number",
        placeholder: "30-250",
        required: false,
        min: 30,
        max: 250,
        step: "0.1",
      },
    ],
  },
  {
    title: "Tobacco and Nicotine",
    questions: [
      {
        id: "smoking_status",
        text: "Which best describes your smoking status?",
        type: "select",
        options: ["Never", "Former", "Current", "Prefer not to say"],
        required: true,
      },
      {
        id: "cigarettes_per_day",
        text: "On average, how many cigarettes do / did you smoke per day?",
        type: "number",
        placeholder: "1-80",
        required: true,
        min: 1,
        max: 80,
        step: "1",
        showWhen: (answers) => ["Former", "Current"].includes(answers.smoking_status),
      },
      {
        id: "years_smoked",
        text: "For about how many years have / did you smoke regularly?",
        type: "number",
        placeholder: "1-70",
        required: true,
        min: 1,
        max: 70,
        step: "1",
        showWhen: (answers) => ["Former", "Current"].includes(answers.smoking_status),
      },
      {
        id: "years_since_quit",
        text: "If you quit, how many years ago did you stop?",
        type: "number",
        placeholder: "0-50",
        required: true,
        min: 0,
        max: 50,
        step: "1",
        showWhen: (answers) => answers.smoking_status === "Former",
      },
      {
        id: "secondhand_smoke",
        text: "How often are you exposed to secondhand smoke?",
        type: "select",
        options: ["Rarely / never", "1-3 days per week", "4+ days per week", "Not sure"],
        required: true,
      },
      {
        id: "other_nicotine",
        text: "Do you currently use any other nicotine products?",
        type: "checkbox",
        options: ["Vaping / e-cigarettes", "Cigars / pipe", "Smokeless tobacco", "None"],
        required: false,
        exclusiveOptions: ["None"],
      },
    ],
  },
  {
    title: "Alcohol Use",
    questions: [
      {
        id: "alcohol_frequency",
        text: "How often do you drink alcohol?",
        type: "select",
        options: [
          "Never",
          "Less than once a week",
          "1-2 days a week",
          "3-4 days a week",
          "5+ days a week",
          "Prefer not to say",
        ],
        required: true,
      },
      {
        id: "drinks_per_day",
        text: "On a typical drinking day, how many standard drinks do you have?",
        type: "select",
        options: ["1", "2", "3-4", "5+", "Not sure"],
        required: true,
        showWhen: (answers) => answers.alcohol_frequency && answers.alcohol_frequency !== "Never",
      },
      {
        id: "heavy_drinking",
        text: "How often do you have 5+ drinks on one occasion?",
        type: "select",
        options: ["Never", "Less than monthly", "Monthly", "Weekly or more", "Prefer not to say"],
        required: false,
        showWhen: (answers) => answers.alcohol_frequency && answers.alcohol_frequency !== "Never",
      },
    ],
  },
  {
    title: "Food Pattern",
    questions: [
      {
        id: "processed_meat",
        text: "How often do you eat processed meat? (bacon, ham, sausages, hot dogs)",
        type: "select",
        options: [
          "Rarely / never",
          "1-3 times per month",
          "1-2 times per week",
          "3-4 times per week",
          "5+ times per week",
        ],
        required: true,
      },
      {
        id: "red_meat",
        text: "How often do you eat red meat? (beef, pork, lamb, or goat)",
        type: "select",
        options: [
          "Rarely / never",
          "1-3 times per month",
          "1-2 times per week",
          "3-4 times per week",
          "5+ times per week",
        ],
        required: false,
      },
      {
        id: "salt_preserved_foods",
        text: "How often do you eat salt-preserved, pickled, smoked, or heavily cured foods?",
        type: "select",
        options: [
          "Rarely / never",
          "1-3 times per month",
          "1-2 times per week",
          "3-4 times per week",
          "5+ times per week",
        ],
        required: true,
      },
      {
        id: "fruit_veg",
        text: "On most days, how many servings of fruit and vegetables do you eat? (1 serving is about 1/2 cup of cooked vegetables)",
        type: "select",
        options: ["Less than 2", "2-4", "5 or more", "Not sure"],
        required: true,
      },
    ],
  },
  {
    title: "Movement and Body-Weight Context",
    questions: [
      {
        id: "activity_minutes",
        text: "How much moderate or vigorous physical activity do you usually get each week?",
        type: "select",
        options: ["0-29 min", "30-74 min", "75-149 min", "150-299 min", "300+ min", "Not sure"],
        required: true,
      },
      {
        id: "strength_training",
        text: "How many days per week do you do strength or resistance exercise?",
        type: "select",
        options: ["0", "1", "2", "3+"],
        required: false,
      },
      {
        id: "sitting_hours",
        text: "On a typical day, how many hours do you spend sitting?",
        type: "select",
        options: ["Less than 4", "4-7", "8-10", "More than 10"],
        required: true,
      },
    ],
  },
  {
    title: "Sun, Work, and Environmental Exposures",
    questions: [
      {
        id: "sunburn_history",
        text: "Have you had repeated severe sunburns, especially before age 25?",
        type: "select",
        options: ["No", "Yes, once or twice", "Yes, several times", "Not sure"],
        required: false,
      },
      {
        id: "tanning_bed",
        text: "Have you ever used tanning beds or indoor tanning devices?",
        type: "select",
        options: ["Never", "Tried once or twice", "Used occasionally", "Used regularly"],
        required: false,
      },
      {
        id: "occupational_exposure",
        text: "Have you had long-term work exposure to dusts, fumes, radiation, or chemicals linked with cancer?",
        type: "select",
        options: ["No", "Yes, occasional", "Yes, long-term", "Not sure"],
        required: true,
      },
      {
        id: "exposure_examples",
        text: "Which exposures are most relevant?",
        type: "checkbox",
        options: [
          "Asbestos",
          "Benzene / solvents",
          "Diesel exhaust",
          "Silica / industrial dust",
          "Medical or industrial radiation",
          "Other / not sure",
        ],
        required: false,
        showWhen: (answers) => answers.occupational_exposure && answers.occupational_exposure !== "No",
      },
    ],
  },
  {
    title: "Infections, Vaccines, and Family History",
    questions: [
      {
        id: "hpv_vaccine",
        text: "What is your HPV vaccination status?",
        type: "select",
        options: ["Completed", "Started but not completed", "Not vaccinated", "Not sure", "Not applicable"],
        required: false,
      },
      {
        id: "hepatitis_history",
        text: "Have you ever been told you had hepatitis B or hepatitis C?",
        type: "checkbox",
        options: ["Hepatitis B", "Hepatitis C", "Neither known", "Not sure"],
        required: false,
        exclusiveOptions: ["Neither known", "Not sure"],
      },
      {
        id: "h_pylori_history",
        text: "Have you ever been told you had H. pylori infection?",
        type: "select",
        options: ["No known history", "Yes, treated", "Yes, not sure if treated", "Not sure"],
        required: false,
      },
      {
        id: "family_history_level",
        text: "Do any first-degree relatives (parent, sibling, child) have a history of cancer?",
        type: "select",
        options: ["No", "Yes, one relative", "Yes, two or more relatives", "Not sure"],
        required: true,
      },
      {
        id: "family_history_types",
        text: "Which cancer types are most relevant in your family?",
        type: "checkbox",
        options: ["Breast / ovarian", "Colorectal", "Stomach", "Lung", "Liver", "Prostate", "Other / not sure"],
        required: true,
        showWhen: (answers) => String(answers.family_history_level || "").startsWith("Yes"),
      },
      {
        id: "youngest_family_dx",
        text: "What was the youngest age at diagnosis among them?",
        type: "select",
        options: ["Under 50", "50-64", "65+", "Not sure"],
        required: true,
        showWhen: (answers) => String(answers.family_history_level || "").startsWith("Yes"),
      },
    ],
  },
  {
    title: "Prior Screening and Symptom Check-In",
    questions: [
      {
        id: "last_checkup",
        text: "When was your last routine health check-up?",
        type: "select",
        options: ["Within 12 months", "1-2 years ago", "More than 2 years ago", "Never / not sure"],
        required: true,
      },
      {
        id: "screening_history",
        text: "Which cancer screening checks have you had before?",
        type: "checkbox",
        options: [
          "Breast screening",
          "Cervical screening",
          "Colorectal screening",
          "PSA / prostate discussion or test",
          "Low-dose CT lung screening",
          "None / not sure",
        ],
        required: false,
        exclusiveOptions: ["None / not sure"],
      },
      {
        id: "symptoms_recent",
        text: "In the last 3 months, have you noticed any of the following?",
        type: "checkbox",
        options: [
          "Persistent cough or hoarseness",
          "Trouble swallowing",
          "New lump or swelling",
          "Blood in stool or urine",
          "Unexplained weight loss",
          "Ongoing change in bowel habits",
          "Unusual bleeding",
          "None of the above",
        ],
        required: false,
        exclusiveOptions: ["None of the above"],
      },
    ],
  },
];

const allQuestions = steps.flatMap((step) => step.questions);
const questionsById = new Map(allQuestions.map((question) => [question.id, question]));

const state = {
  currentStep: 0,
  isProcessing: false,
  processingProgress: 0,
  processingStep: "",
  error: "",
  result: null,
  answers: createInitialAnswers(),
};

const app = document.getElementById("app");

function createInitialAnswers() {
  const answers = {};

  allQuestions.forEach((question) => {
    answers[question.id] = question.type === "checkbox" ? [] : null;
  });

  return answers;
}

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
  const step = steps[state.currentStep];
  syncHiddenAnswersForStep(step);
  const visibleQuestions = getVisibleQuestions(step);
  const progressPercent = Math.round((state.currentStep / steps.length) * 100);

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

  visibleQuestions.forEach((question) => {
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
  form.addEventListener("change", handleFieldChange);
  form.addEventListener("input", handleFieldChange);
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
    input.min = question.min;
    input.max = question.max;
    input.step = question.step || "1";
    input.value = state.answers[question.id] ?? "";
    return input;
  }

  const group = document.createElement("div");
  group.className = "choice-group";

  question.options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "choice-card";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = question.id;
    input.value = option;
    input.checked = Array.isArray(state.answers[question.id]) && state.answers[question.id].includes(option);

    const text = document.createElement("span");
    text.textContent = option;

    label.appendChild(input);
    label.appendChild(text);
    group.appendChild(label);
  });

  return group;
}

function renderProcessing() {
  const processingState = app.querySelector(".processing-state");
  if (processingState) {
    updateProcessingView();
    return;
  }

  app.innerHTML = `
    <div class="processing-state">
      <div class="processing-hero">
        <div class="processing-panel">
          <div class="processing-grid"></div>
          <div class="processing-orb processing-orb-a"></div>
          <div class="processing-orb processing-orb-b"></div>
          <div class="processing-beam"></div>
          <div class="processing-node processing-node-a"></div>
          <div class="processing-node processing-node-b"></div>
          <div class="processing-node processing-node-c"></div>
          <div class="processing-surface">
            <div class="processing-kicker">Live Analysis</div>
            <div class="processing-code">screening.signals()</div>
            <div class="processing-pulse-row">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      <h2 class="processing-title">AI Analyzing Profile</h2>
      <p class="processing-text"></p>
      <div class="loading-bar">
        <div class="loading-fill"></div>
      </div>
      <div class="loading-percent"></div>
      <div class="error-box" hidden></div>
    </div>
  `;

  updateProcessingView();
}

function updateProcessingView() {
  const processingText = app.querySelector(".processing-text");
  const loadingFill = app.querySelector(".loading-fill");
  const loadingPercent = app.querySelector(".loading-percent");
  const errorBox = app.querySelector(".processing-state .error-box");

  if (processingText) {
    processingText.textContent = state.processingStep;
  }

  if (loadingFill) {
    loadingFill.style.width = `${state.processingProgress}%`;
  }

  if (loadingPercent) {
    loadingPercent.textContent = `${Math.round(state.processingProgress)}% Complete`;
  }

  if (errorBox) {
    if (state.error) {
      errorBox.hidden = false;
      errorBox.textContent = state.error;
    } else {
      errorBox.hidden = true;
      errorBox.textContent = "";
    }
  }
}

function renderResult() {
  const result = normalizeResult(state.result);

  app.innerHTML = `
    <div class="result-state">
      <div class="result-header">
        <div class="risk-badge ${summaryLevelClass(result.summaryLevel)}">${escapeHtml(summaryLevelLabel(result.summaryLevel))}</div>
        <h2 class="result-title">${escapeHtml(result.headline)}</h2>
      </div>

      ${renderSignalSection(result.keySignals)}

      <section class="result-summary-block">
        <h3 class="section-title">Summary</h3>
        <p class="result-summary">${escapeHtml(result.summaryText)}</p>
      </section>

      <div class="results-grid">
        ${renderInfoCard(
          "Areas on radar",
          result.areasOnRadar.map(
            (item) =>
              `<li><strong>${escapeHtml(item.area)}</strong> <span class="inline-meta">${escapeHtml(capitalize(item.confidence))} confidence</span><div>${escapeHtml(item.whyOnRadar)}</div></li>`
          )
        )}
        ${renderInfoCard(
          "Screening conversations",
          result.screeningConversationStarters.map(
            (item) =>
              `<li><strong>${escapeHtml(item.topic)}</strong> <span class="inline-meta">${escapeHtml(item.timingLabel)}</span><div>${escapeHtml(item.reason)}</div></li>`
          )
        )}
        ${renderInfoCard(
          "Lifestyle priorities",
          result.lifestylePriorities.map(
            (item) =>
              `<li><strong>${escapeHtml(item.priority)}</strong><div>${escapeHtml(item.action)}</div><div class="subtle-copy">${escapeHtml(item.whyThisHelps)}</div></li>`
          )
        )}
      </div>

      ${renderTriageNotice(result.symptomTriage)}

      <p class="footnote">${escapeHtml(result.disclaimer)}</p>

      <div class="result-actions">
        <button type="button" id="restart-button" class="button button-ghost">Start Over</button>
      </div>
    </div>
  `;

  document.getElementById("restart-button").addEventListener("click", resetForm);
}

function renderSignalSection(signals) {
  if (!signals.length) {
    return "";
  }

  return `
    <section class="signal-section">
      <h3 class="section-title">Signals worth attention</h3>
      <div class="signal-grid">
        ${signals
          .map(
            (item) => `
              <article class="signal-card">
                <h4 class="signal-title">${escapeHtml(item.signal)}</h4>
                <p class="signal-text">${escapeHtml(item.whyItMatters)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderInfoCard(title, items) {
  if (!items.length) {
    return "";
  }

  return `
    <article class="finding-card">
      <div class="finding-header">
        <h3 class="finding-title">${escapeHtml(title)}</h3>
      </div>
      <ul class="finding-points">${items.join("")}</ul>
    </article>
  `;
}

function renderTriageNotice(symptomTriage) {
  if (!symptomTriage || symptomTriage.level === "none") {
    return "";
  }

  return `
    <section class="triage-note ${triageClass(symptomTriage.level)}">
      <div class="triage-note-label">${escapeHtml(symptomLevelLabel(symptomTriage.level))}</div>
      <p>${escapeHtml(symptomTriage.message)}</p>
    </section>
  `;
}

function handleFieldChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement) || !target.name) {
    return;
  }

  const question = questionsById.get(target.name);
  if (!question) {
    return;
  }

  if (question.type === "checkbox") {
    const selected = Array.from(
      document.querySelectorAll(`input[name="${question.id}"]:checked`)
    ).map((node) => node.value);

    state.answers[question.id] = applyExclusiveOptions(
      selected,
      question.exclusiveOptions || [],
      target.value,
      target.checked
    );
    state.error = "";
    render();
    return;
  } else if (question.type === "number") {
    state.answers[question.id] = target.value.trim() ? target.value.trim() : null;
    clearFieldValidation(target);

    if (event.type === "change") {
      const fieldError = validateNumberQuestion(question, state.answers[question.id]);
      if (fieldError) {
        target.setCustomValidity(fieldError);
        target.reportValidity();
      } else {
        target.setCustomValidity("");
      }
    }

    state.error = "";
    return;
  } else {
    state.answers[question.id] = target.value || null;

    if (questionAffectsVisibility(question.id)) {
      state.error = "";
      render();
      return;
    }
  }

  state.error = "";
}

function handleNextStep(event) {
  event.preventDefault();
  state.error = "";

  const step = steps[state.currentStep];
  syncHiddenAnswersForStep(step);
  const validationError = validateStep(step);

  if (validationError) {
    state.error = validationError;
    render();
    return;
  }

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

function validateStep(step) {
  const visibleQuestions = getVisibleQuestions(step);

  for (const question of visibleQuestions) {
    const value = state.answers[question.id];

    if (question.required) {
      if (question.type === "checkbox" && (!Array.isArray(value) || value.length === 0)) {
        return `Please answer "${question.text}".`;
      }

      if ((question.type === "select" || question.type === "number") && (value === null || value === "")) {
        return `Please answer "${question.text}".`;
      }
    }

    if (question.type === "number" && value !== null && value !== "") {
      const fieldError = validateNumberQuestion(question, value);
      if (fieldError) {
        return fieldError;
      }
    }
  }

  return "";
}

function getVisibleQuestions(step) {
  return step.questions.filter((question) => shouldShowQuestion(question, state.answers));
}

function shouldShowQuestion(question, answers) {
  return typeof question.showWhen === "function" ? Boolean(question.showWhen(answers)) : true;
}

function syncHiddenAnswersForStep(step) {
  step.questions.forEach((question) => {
    if (shouldShowQuestion(question, state.answers)) {
      return;
    }

    state.answers[question.id] = question.type === "checkbox" ? null : null;
  });
}

function applyExclusiveOptions(selectedValues, exclusiveOptions, changedValue, isChecked) {
  if (!selectedValues.length || !exclusiveOptions.length) {
    return selectedValues;
  }

  if (exclusiveOptions.includes(changedValue) && isChecked) {
    return [changedValue];
  }

  if (!exclusiveOptions.includes(changedValue)) {
    return selectedValues.filter((value) => !exclusiveOptions.includes(value));
  }

  return selectedValues;
}

function questionAffectsVisibility(questionId) {
  return [
    "smoking_status",
    "alcohol_frequency",
    "occupational_exposure",
    "family_history_level",
  ].includes(questionId);
}

function validateNumberQuestion(question, value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return `Please enter a valid number for "${question.text}".`;
  }

  if (typeof question.min === "number" && numericValue < question.min) {
    return `Please enter a value of at least ${question.min} for "${question.text}".`;
  }

  if (typeof question.max === "number" && numericValue > question.max) {
    return `Please enter a value no greater than ${question.max} for "${question.text}".`;
  }

  return "";
}

function clearFieldValidation(field) {
  if (typeof field.setCustomValidity === "function") {
    field.setCustomValidity("");
  }
}

async function analyzeRisk() {
  state.isProcessing = true;
  state.processingProgress = 6;
  state.processingStep = "Preparing questionnaire payload...";
  state.error = "";
  render();

  const startTime = Date.now();
  const interval = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    state.processingProgress = estimateProgress(elapsed);
    state.processingStep = estimateProcessingStep(elapsed);
    renderProcessing();
  }, 450);

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
      throw new Error(`DeepSeek request failed with status ${response.status}. ${rawError}`);
    }

    state.processingProgress = 94;
    state.processingStep = "Finalizing your report...";
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

function formatAnswersForModel(answers) {
  const userAnswers = {};

  allQuestions.forEach((question) => {
    const value = answers[question.id];

    if (question.type === "checkbox") {
      userAnswers[question.id] = value === null ? null : Array.isArray(value) ? value : [];
      return;
    }

    userAnswers[question.id] = value ?? null;
  });

  return {
    user_answers: userAnswers,
    derived_fields: buildDerivedFields(userAnswers),
  };
}

function buildDerivedFields(userAnswers) {
  const bmiEstimate = estimateBmi(userAnswers.height_cm, userAnswers.weight_kg);
  const packYearEstimate = estimatePackYears(
    userAnswers.cigarettes_per_day,
    userAnswers.years_smoked
  );

  return {
    bmi_estimate: bmiEstimate,
    pack_year_estimate: packYearEstimate,
    alcohol_pattern_estimate: estimateAlcoholPattern(
      userAnswers.alcohol_frequency,
      userAnswers.drinks_per_day,
      userAnswers.heavy_drinking
    ),
  };
}

function estimateBmi(heightCm, weightKg) {
  const height = Number(heightCm);
  const weight = Number(weightKg);

  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0) {
    return null;
  }

  const heightMeters = height / 100;
  return Number((weight / (heightMeters * heightMeters)).toFixed(1));
}

function estimatePackYears(cigarettesPerDay, yearsSmoked) {
  const cigarettes = Number(cigarettesPerDay);
  const years = Number(yearsSmoked);

  if (!Number.isFinite(cigarettes) || !Number.isFinite(years)) {
    return null;
  }

  return Number(((cigarettes / 20) * years).toFixed(1));
}

function estimateAlcoholPattern(frequency, drinksPerDay, heavyDrinking) {
  if (!frequency || frequency === "Never") {
    return "none_or_minimal";
  }

  if (heavyDrinking === "Weekly or more" || drinksPerDay === "5+") {
    return "higher_intake_pattern";
  }

  if (frequency === "3-4 days a week" || frequency === "5+ days a week" || drinksPerDay === "3-4") {
    return "regular_intake_pattern";
  }

  return "lower_or_moderate_pattern";
}

function estimateProgress(elapsedMs) {
  if (elapsedMs < 4000) {
    return 6 + (elapsedMs / 4000) * 14;
  }

  if (elapsedMs < 12000) {
    return 20 + ((elapsedMs - 4000) / 8000) * 20;
  }

  if (elapsedMs < 24000) {
    return 40 + ((elapsedMs - 12000) / 12000) * 22;
  }

  if (elapsedMs < 42000) {
    return 62 + ((elapsedMs - 24000) / 18000) * 20;
  }

  return 82 + ((elapsedMs - 42000) / 20000) * 8;
}

function estimateProcessingStep(elapsedMs) {
  if (elapsedMs < 5000) {
    return "Preparing questionnaire payload...";
  }

  if (elapsedMs < 13000) {
    return "Sending request to DeepSeek...";
  }

  if (elapsedMs < 28000) {
    return "Reviewing prevention, screening, and symptom signals...";
  }

  if (elapsedMs < 42000) {
    return "Drafting your structured summary...";
  }

  return "Polishing the final response...";
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

  const summaryLevel = normalizeSummaryLevel(result.summaryLevel ?? result.summary_level);
  const headline = readNonEmptyString(result.headline, "Cancer awareness check");
  const summaryText = readNonEmptyString(result.summaryText ?? result.summary_text, "");
  const keySignals = normalizeKeySignals(result.keySignals ?? result.key_signals);
  const areasOnRadar = normalizeAreasOnRadar(result.areasOnRadar ?? result.areas_on_radar);
  const screeningConversationStarters = normalizeScreeningStarters(
    result.screeningConversationStarters ?? result.screening_conversation_starters
  );
  const lifestylePriorities = normalizeLifestylePriorities(
    result.lifestylePriorities ?? result.lifestyle_priorities
  );
  const symptomTriage = normalizeSymptomTriage(result.symptomTriage ?? result.symptom_triage);
  const disclaimer = readNonEmptyString(
    result.disclaimer,
    "Educational only. Not a diagnosis. Seek medical advice for symptoms, concerns, or personalised screening decisions."
  );

  if (!summaryText) {
    throw new Error("AI result is missing summary_text.");
  }

  return {
    toolName: readNonEmptyString(result.toolName ?? result.tool_name, "Cancer Awareness Check"),
    version: readNonEmptyString(result.version, "1.0"),
    educationalOnly: (result.educationalOnly ?? result.educational_only) !== false,
    summaryLevel,
    headline,
    summaryText,
    keySignals,
    areasOnRadar,
    screeningConversationStarters,
    lifestylePriorities,
    symptomTriage,
    disclaimer,
  };
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

function normalizeSummaryLevel(value) {
  const normalized = String(value || "").trim().toUpperCase();

  if (normalized === "FEW_SIGNALS" || normalized === "SOME_SIGNALS" || normalized === "SEVERAL_SIGNALS") {
    return normalized;
  }

  throw new Error(`Unsupported summary_level: ${value}`);
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

function summaryLevelLabel(level) {
  if (level === "FEW_SIGNALS") {
    return "Few Signals";
  }

  if (level === "SOME_SIGNALS") {
    return "Some Signals";
  }

  return "Several Signals";
}

function summaryLevelClass(level) {
  if (level === "FEW_SIGNALS") {
    return "low";
  }

  if (level === "SOME_SIGNALS") {
    return "moderate";
  }

  return "high";
}

function symptomLevelLabel(level) {
  if (level === "none") {
    return "No Urgent Flag";
  }

  if (level === "soon") {
    return "Review Soon";
  }

  return "Prompt Review";
}

function triageClass(level) {
  if (level === "none") {
    return "low";
  }

  if (level === "soon") {
    return "moderate";
  }

  return "high";
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function resetForm() {
  state.currentStep = 0;
  state.isProcessing = false;
  state.processingProgress = 0;
  state.processingStep = "";
  state.error = "";
  state.result = null;
  state.answers = createInitialAnswers();
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
