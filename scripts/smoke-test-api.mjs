import handler from "../api/analyze-risk.js";

try {
  process.loadEnvFile?.(".env.local");
} catch (error) {
  // Ignore missing local env file and fall back to existing process.env.
}

const questionnaire = {
  user_answers: {
    age_group: "55-64",
    sex_at_birth: "Male",
    organs_relevant: ["Prostate"],
    height_cm: 175,
    weight_kg: 84,
    smoking_status: "Former",
    cigarettes_per_day: 20,
    years_smoked: 25,
    years_since_quit: 8,
    secondhand_smoke: "Rarely / never",
    other_nicotine: ["None"],
    alcohol_frequency: "1-2 days a week",
    drinks_per_day: "2",
    heavy_drinking: "Never",
    processed_meat: "1-2 times per week",
    red_meat: "1-2 times per week",
    salt_preserved_foods: "Rarely / never",
    fruit_veg: "2-4",
    activity_minutes: "75-149 min",
    strength_training: "1",
    sitting_hours: "8-10",
    sunburn_history: "No",
    tanning_bed: "Never",
    occupational_exposure: "No",
    exposure_examples: null,
    hpv_vaccine: "Not applicable",
    hepatitis_history: ["Neither known"],
    h_pylori_history: "Not sure",
    family_history_level: "Yes, one relative",
    family_history_types: ["Colorectal"],
    youngest_family_dx: "Under 50",
    last_checkup: "More than 2 years ago",
    screening_history: ["None / not sure"],
    symptoms_recent: ["None of the above"],
  },
  derived_fields: {
    bmi_estimate: 27.4,
    pack_year_estimate: 25,
    alcohol_pattern_estimate: "lower_or_moderate_pattern",
  },
};

const req = {
  method: "POST",
  body: {
    questionnaire,
  },
  headers: {
    "user-agent": "local-smoke-test",
  },
};

const res = createMockResponse();

await handler(req, res);

console.log(JSON.stringify({ statusCode: res.statusCode, body: res.body }, null, 2));

if (res.statusCode !== 200) {
  process.exitCode = 1;
}

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end(payload) {
      this.body = payload ?? null;
      return this;
    },
  };
}
