const PROVIDER_DEFAULTS = {
  openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
  gemini: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  anthropic: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  xai: process.env.XAI_MODEL || "grok-4-1-fast-reasoning"
};

const PROVIDER_KEYS = {
  openai: process.env.OPENAI_API_KEY,
  gemini: process.env.GEMINI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  xai: process.env.XAI_API_KEY
};

function resolveAiSettings(options = {}) {
  const provider = options.provider || "openai";
  const apiKey = options.apiKey || PROVIDER_KEYS[provider];
  let model = options.model || PROVIDER_DEFAULTS[provider];
  if (provider === "gemini" && typeof model === "string" && model.startsWith("models/")) {
    model = model.replace(/^models\//, "");
  }
  const enabledFlag =
    options.enabled !== undefined
      ? Boolean(options.enabled)
      : String(process.env.AI_ENABLED || "true").toLowerCase() !== "false";
  const enabled = Boolean(apiKey) && enabledFlag;
  return { provider, apiKey, model, enabled };
}

function extractOutputText(response) {
  if (!response || !Array.isArray(response.output)) return null;
  for (const item of response.output) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) {
        return part.text;
      }
    }
  }
  return null;
}

function clampNumber(value, min, max, fallback = min) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

function stripCodeFences(text) {
  const trimmed = String(text || "").trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }
  return trimmed;
}

function extractJson(text) {
  const cleaned = stripCodeFences(text);
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

async function requestProviderText(prompt, settings, schemaName, schema) {
  const { provider, apiKey, model } = settings;
  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions: "You are a nutrition analyst. Return JSON that matches the schema only.",
        input: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            strict: true,
            schema
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, reason: "api_error", detail: errorText.slice(0, 300) };
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    if (!outputText) return { ok: false, reason: "no_output" };
    return { ok: true, text: outputText };
  }

  if (provider === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\nReturn JSON only.` }] }],
          generationConfig: { temperature: 0.2 }
        })
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, reason: "api_error", detail: errorText.slice(0, 300) };
    }
    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    if (!text) return { ok: false, reason: "no_output" };
    return { ok: true, text };
  }

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: `${prompt}\nReturn JSON only.` }]
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, reason: "api_error", detail: errorText.slice(0, 300) };
    }
    const data = await response.json();
    const text =
      data?.content?.map((part) => (part.type === "text" ? part.text : "")).join("") || "";
    if (!text) return { ok: false, reason: "no_output" };
    return { ok: true, text };
  }

  if (provider === "xai") {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Return JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, reason: "api_error", detail: errorText.slice(0, 300) };
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) return { ok: false, reason: "no_output" };
    return { ok: true, text };
  }

  return { ok: false, reason: "unsupported_provider" };
}

export async function validateAiKey(options = {}) {
  const settings = resolveAiSettings({ ...options, enabled: true });
  if (!settings.apiKey) {
    return { ok: false, reason: "missing_key" };
  }

  const schema = {
    type: "object",
    properties: {
      ok: { type: "boolean" }
    },
    required: ["ok"],
    additionalProperties: false
  };

  const prompt = "Return JSON: {\"ok\": true}";
  const response = await requestProviderText(prompt, settings, "validate_schema", schema);
  if (!response.ok) return response;
  const parsed = extractJson(response.text);
  if (!parsed || parsed.ok !== true) {
    return { ok: false, reason: "parse_error" };
  }
  return { ok: true };
}

export async function estimateFoodMacros(foodName, options = {}) {
  const settings = resolveAiSettings(options);
  const { enabled } = settings;
  if (!enabled) {
    return { ok: false, reason: "disabled" };
  }

  if (typeof fetch !== "function") {
    return { ok: false, reason: "fetch_unavailable" };
  }

  const prompt = `Estimate nutrition per 100g edible portion for: ${foodName}.
Return typical values for a plain, cooked version if the food is commonly cooked.
Values must be realistic, and sodium should be in milligrams.`;

  const schema = {
    type: "object",
    properties: {
      calories: { type: "number" },
      protein: { type: "number" },
      carbs: { type: "number" },
      fat: { type: "number" },
      fiber: { type: "number" },
      sodium: { type: "number" },
      confidence: { type: "number" },
      notes: { type: "string" }
    },
    required: [
      "calories",
      "protein",
      "carbs",
      "fat",
      "fiber",
      "sodium",
      "confidence",
      "notes"
    ],
    additionalProperties: false
  };

  const response = await requestProviderText(prompt, settings, "food_macro_schema", schema);
  if (!response.ok) return response;
  const parsed = extractJson(response.text);
  if (!parsed) return { ok: false, reason: "parse_error" };

  const protein = clampNumber(parsed.protein, 0, 200);
  const carbs = clampNumber(parsed.carbs, 0, 250);
  const fat = clampNumber(parsed.fat, 0, 200);
  const fiber = clampNumber(parsed.fiber, 0, 60);
  const sodium = clampNumber(parsed.sodium, 0, 5000);
  const calories = clampNumber(
    parsed.calories || protein * 4 + carbs * 4 + fat * 9,
    0,
    2000
  );
  const confidence = clampNumber(parsed.confidence, 0, 1, 0.5);

  return {
    ok: true,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sodium,
    confidence,
    notes: String(parsed.notes || "AI estimate")
  };
}

export async function generateMealPlan(input, options = {}) {
  const settings = resolveAiSettings(options);
  const { enabled } = settings;
  if (!enabled) {
    return { ok: false, reason: "disabled" };
  }

  if (typeof fetch !== "function") {
    return { ok: false, reason: "fetch_unavailable" };
  }

  const profile = input?.profile || {};
  const targets = input?.targets || {};
  const context = input?.context || {};
  const health = String(input?.healthComplications || "").trim();

  const prompt = `Create a 7-day meal plan with breakfast, lunch, dinner, and 1 snack per day.
Use the provided profile, goals, and available foods/plates as strong preferences.
If a preferred item is missing, you can suggest a small number of additions.
Always include a short caution that this is AI-generated and should be reviewed with a professional if needed.

Profile:
- Sex: ${profile.sex || "unspecified"}
- Age: ${profile.age || "unknown"}
- Height cm: ${profile.height_cm || "unknown"}
- Current weight kg: ${profile.current_weight_kg || "unknown"}
- BMI: ${profile.bmi || "unknown"}
- Activity: ${profile.activity_level || "unknown"}
- Goal: ${profile.goal || "maintain"} (goal weight kg: ${profile.goal_weight_kg || "unknown"}, pace kg/week: ${profile.pace_kg_per_week || "unknown"})

Targets:
- Calories: ${targets.calories || "unknown"}
- Protein g: ${targets.protein || "unknown"}
- Carbs g: ${targets.carbs || "unknown"}
- Fat g: ${targets.fat || "unknown"}
- Fiber g: ${targets.fiber || "unknown"}
- Daily cost target: ${targets.daily_cost || "unknown"} ${profile.currency || "USD"}

Recent intake summary (last 7 days):
- Avg calories: ${context.avg_calories || "unknown"}
- Avg protein g: ${context.avg_protein || "unknown"}
- Avg carbs g: ${context.avg_carbs || "unknown"}
- Avg fat g: ${context.avg_fat || "unknown"}
- Avg cost: ${context.avg_cost || "unknown"}

Health considerations: ${health || "none reported"}
Preferences: ${String(input?.preferences || "none")}
Foods to prefer: ${(input?.foods || []).slice(0, 80).join(", ") || "none"}
Saved plates: ${(input?.plates || []).slice(0, 30).join(", ") || "none"}
Avoid: ${String(input?.avoid || "none")}

Return JSON that matches the schema exactly.`;

  const schema = {
    type: "object",
    properties: {
      summary: { type: "string" },
      daily_targets: {
        type: "object",
        properties: {
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          fiber: { type: "number" }
        },
        required: ["calories", "protein", "carbs", "fat", "fiber"],
        additionalProperties: false
      },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "string" },
            total_calories: { type: "number" },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  items: { type: "array", items: { type: "string" } },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  notes: { type: "string" }
                },
                required: ["name", "items", "calories", "protein", "carbs", "fat", "notes"],
                additionalProperties: false
              }
            }
          },
          required: ["day", "total_calories", "meals"],
          additionalProperties: false
        }
      },
      shopping_list: { type: "array", items: { type: "string" } },
      tips: { type: "array", items: { type: "string" } },
      cautions: { type: "array", items: { type: "string" } }
    },
    required: ["summary", "daily_targets", "days", "shopping_list", "tips", "cautions"],
    additionalProperties: false
  };

  const response = await requestProviderText(prompt, settings, "meal_plan_schema", schema);
  if (!response.ok) return response;
  const parsed = extractJson(response.text);
  if (!parsed) return { ok: false, reason: "parse_error" };

  return { ok: true, plan: parsed };
}

export function aiEnabled(options = {}) {
  return resolveAiSettings(options).enabled;
}
