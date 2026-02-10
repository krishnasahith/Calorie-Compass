const state = {
  selectedFoodId: null,
  selectedFood: null,
  suggestions: [],
  favorites: [],
  recent: [],
  entries: [],
  pendingEntry: null,
  targets: null,
  totals: null,
  profile: null,
  weights: [],
  measurements: [],
  plates: [],
  plateDraft: [],
  plateSuggestions: [],
  activity: [],
  summaryRange: [],
  recommendation: null,
  mealPlan: null,
  rations: []
};

let pendingAvatarData = null;
let rationEditingId = null;

const foodNameInput = document.getElementById("foodName");
const foodGramsInput = document.getElementById("foodGrams");
const mealTypeInput = document.getElementById("mealType");
const suggestionList = document.getElementById("suggestionList");
const foodDetails = document.getElementById("foodDetails");
const entryError = document.getElementById("entryError");
const entriesList = document.getElementById("entriesList");
const summaryCards = document.getElementById("summaryCards");
const macroSplit = document.getElementById("macroSplit");
const macroSplitLabel = document.getElementById("macroSplitLabel");
const rationGrid = document.getElementById("rationGrid");
const favoriteList = document.getElementById("favoriteList");
const recentList = document.getElementById("recentList");
const datePicker = document.getElementById("datePicker");
const todayDate = document.getElementById("todayDate");
const todayTitle = document.getElementById("todayTitle");
const userAvatar = document.getElementById("userAvatar");
const calorieTrendChart = document.getElementById("calorieTrendChart");
const plannedCaloriesInput = document.getElementById("plannedCalories");
const useSuggestedCalories = document.getElementById("useSuggestedCalories");
const savePlannedCalories = document.getElementById("savePlannedCalories");
const plannedCaloriesStatus = document.getElementById("plannedCaloriesStatus");
const dietScoreValue = document.getElementById("dietScoreValue");
const dietScoreLabel = document.getElementById("dietScoreLabel");
const consistencyValue = document.getElementById("consistencyValue");
const consistencyLabel = document.getElementById("consistencyLabel");
const projectionValue = document.getElementById("projectionValue");
const projectionLabel = document.getElementById("projectionLabel");
const targetCostInput = document.getElementById("targetCost");

const profileForm = document.getElementById("profileForm");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileSex = document.getElementById("profileSex");
const profileBirthYear = document.getElementById("profileBirthYear");
const profileHeight = document.getElementById("profileHeight");
const profileHeightUnit = document.getElementById("profileHeightUnit");
const profileActivity = document.getElementById("profileActivity");
const profileGoal = document.getElementById("profileGoal");
const profileGoalWeight = document.getElementById("profileGoalWeight");
const profileWeightUnit = document.getElementById("profileWeightUnit");
const profilePace = document.getElementById("profilePace");
const profileCurrency = document.getElementById("profileCurrency");
const recommendationPanel = document.getElementById("recommendationPanel");
const profileAvatarInput = document.getElementById("profileAvatarInput");
const profileAvatarPreview = document.getElementById("profileAvatarPreview");
const saveAvatarBtn = document.getElementById("saveAvatar");
const avatarStatus = document.getElementById("avatarStatus");
const profileStatus = document.getElementById("profileStatus");
const targetsStatus = document.getElementById("targetsStatus");
const profileMetrics = document.getElementById("profileMetrics");

const privacyForm = document.getElementById("privacyForm");
const privacyName = document.getElementById("privacyName");
const privacyEmail = document.getElementById("privacyEmail");
const privacyPhone = document.getElementById("privacyPhone");
const privacyHeight = document.getElementById("privacyHeight");
const privacyWeight = document.getElementById("privacyWeight");
const privacyBmi = document.getElementById("privacyBmi");
const privacyMeasurements = document.getElementById("privacyMeasurements");
const privacyGoal = document.getElementById("privacyGoal");
const privacyActivity = document.getElementById("privacyActivity");
const privacyAvatar = document.getElementById("privacyAvatar");
const profileQr = document.getElementById("profileQr");
const publicProfileLink = document.getElementById("publicProfileLink");

const weightForm = document.getElementById("weightForm");
const weightValue = document.getElementById("weightValue");
const weightUnit = document.getElementById("weightUnit");
const weightDate = document.getElementById("weightDate");
const weightChart = document.getElementById("weightChart");
const weightStatus = document.getElementById("weightStatus");

const measureForm = document.getElementById("measureForm");
const measureUnit = document.getElementById("measureUnit");
const measureDate = document.getElementById("measureDate");
const measureWaist = document.getElementById("measureWaist");
const measureChest = document.getElementById("measureChest");
const measureHip = document.getElementById("measureHip");
const measureThigh = document.getElementById("measureThigh");
const measureArm = document.getElementById("measureArm");
const measureNeck = document.getElementById("measureNeck");
const waistChart = document.getElementById("waistChart");
const measureStatus = document.getElementById("measureStatus");

const activityForm = document.getElementById("activityForm");
const activityDate = document.getElementById("activityDate");
const activitySteps = document.getElementById("activitySteps");
const activitySleep = document.getElementById("activitySleep");
const activityRhr = document.getElementById("activityRhr");
const activityCalories = document.getElementById("activityCalories");
const stepsChart = document.getElementById("stepsChart");
const sleepChart = document.getElementById("sleepChart");
const activityStatus = document.getElementById("activityStatus");

const plateName = document.getElementById("plateName");
const plateFoodName = document.getElementById("plateFoodName");
const plateFoodGrams = document.getElementById("plateFoodGrams");
const addPlateItemBtn = document.getElementById("addPlateItem");
const plateItemList = document.getElementById("plateItemList");
const savePlateBtn = document.getElementById("savePlate");
const clearPlateBtn = document.getElementById("clearPlate");
const plateList = document.getElementById("plateList");
const plateSuggestionList = document.getElementById("plateSuggestionList");
const plateMeal = document.getElementById("plateMeal");
const quickPlateMeal = document.getElementById("quickPlateMeal");
const quickPlateList = document.getElementById("quickPlateList");
const quickPlateStatus = document.getElementById("quickPlateStatus");

const rationForm = document.getElementById("rationForm");
const rationName = document.getElementById("rationName");
const rationQty = document.getElementById("rationQty");
const rationUnit = document.getElementById("rationUnit");
const rationGramsPerUnit = document.getElementById("rationGramsPerUnit");
const rationCost = document.getElementById("rationCost");
const rationCurrency = document.getElementById("rationCurrency");
const rationSaveBtn = document.getElementById("rationSaveBtn");
const rationClearBtn = document.getElementById("rationClearBtn");
const rationStatus = document.getElementById("rationStatus");
const rationList = document.getElementById("rationList");
const rationEstimateBtn = document.getElementById("rationEstimateBtn");
const rationEstimate = document.getElementById("rationEstimate");
const rationEstimateStatus = document.getElementById("rationEstimateStatus");

const mealPlanForm = document.getElementById("mealPlanForm");
const mealPlanHealth = document.getElementById("mealPlanHealth");
const mealPlanPreferences = document.getElementById("mealPlanPreferences");
const mealPlanAvoid = document.getElementById("mealPlanAvoid");
const mealPlanUseRations = document.getElementById("mealPlanUseRations");
const mealPlanStatus = document.getElementById("mealPlanStatus");
const mealPlanDisplay = document.getElementById("mealPlanDisplay");
const mealPlanMeta = document.getElementById("mealPlanMeta");
const mealPlanRegenerate = document.getElementById("mealPlanRegenerate");
const mealPlanEditToggle = document.getElementById("mealPlanEditToggle");
const mealPlanEditorWrap = document.getElementById("mealPlanEditorWrap");
const mealPlanEditor = document.getElementById("mealPlanEditor");
const mealPlanSave = document.getElementById("mealPlanSave");

const importType = document.getElementById("importType");
const samsungImportFile = document.getElementById("samsungImportFile");
const importSamsung = document.getElementById("importSamsung");
const importStatus = document.getElementById("importStatus");
const aiSettingsForm = document.getElementById("aiSettingsForm");
const aiProvider = document.getElementById("aiProvider");
const aiApiKey = document.getElementById("aiApiKey");
const aiModel = document.getElementById("aiModel");
const aiEnabledToggle = document.getElementById("aiEnabledToggle");
const aiClearKey = document.getElementById("aiClearKey");
const aiValidateKey = document.getElementById("aiValidateKey");
const aiStatus = document.getElementById("aiStatus");
const aiStatusMeta = document.getElementById("aiStatusMeta");
const aiApiKeyLabel = document.getElementById("aiApiKeyLabel");
const aiModelOptions = document.getElementById("aiModelOptions");

const navButtons = document.querySelectorAll(".nav-btn");
const pageSections = document.querySelectorAll(".page-section");

function formatNumber(value, digits = 0) {
  return Number(value).toFixed(digits).replace(/\.0+$/, "");
}

function formatCurrency(value, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(value, 2)}`;
  }
}

function setStatus(el, message, type) {
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("success", "error");
  if (message && type) el.classList.add(type);
}

function initialsFromName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

function makeAvatarDataUrl(initials) {
  const label = initials || "U";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
    <rect width="120" height="120" fill="#e2e8f0"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Sora, sans-serif" font-size="42" fill="#0f172a">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function setAvatar(image, name) {
  const fallback = makeAvatarDataUrl(initialsFromName(name));
  if (userAvatar) {
    userAvatar.src = image || fallback;
  }
  if (profileAvatarPreview) {
    profileAvatarPreview.src = image || fallback;
  }
}

function updateAiProviderUi(provider) {
  if (!aiProvider) return;
  const labelMap = {
    openai: "OpenAI API key",
    gemini: "Gemini API key",
    anthropic: "Anthropic API key",
    xai: "xAI API key"
  };
  const placeholderMap = {
    openai: "gpt-4o-mini",
    gemini: "gemini-2.5-flash",
    anthropic: "claude-sonnet-4-20250514",
    xai: "grok-4-1-fast-reasoning"
  };
  const modelOptions = {
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4o-2024-08-06", "gpt-4o-2024-11-20"],
    gemini: [
      "gemini-3-pro-preview",
      "gemini-3-flash-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-preview-09-2025",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash-lite-preview-09-2025",
      "gemini-flash-latest"
    ],
    anthropic: [
      "claude-opus-4-1-20250805",
      "claude-opus-4-20250514",
      "claude-sonnet-4-20250514",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-haiku-20241022",
      "claude-3-haiku-20240307"
    ],
    xai: [
      "grok-4-1-fast-reasoning",
      "grok-4-1-fast-non-reasoning",
      "grok-4-fast-reasoning",
      "grok-4-fast-non-reasoning",
      "grok-code-fast-1",
      "grok-4"
    ]
  };
  if (aiApiKeyLabel) aiApiKeyLabel.textContent = labelMap[provider] || "API key";
  if (aiModel && !aiModel.value) {
    aiModel.placeholder = placeholderMap[provider] || "model-name";
  }
  if (aiModelOptions) {
    const options = modelOptions[provider] || [];
    aiModelOptions.innerHTML = options.map((item) => `<option value="${item}"></option>`).join("");
  }
}

function defaultModelForProvider(provider) {
  const defaults = {
    openai: "gpt-4o-mini",
    gemini: "gemini-2.5-flash",
    anthropic: "claude-sonnet-4-20250514",
    xai: "grok-4-1-fast-reasoning"
  };
  return defaults[provider] || "gpt-4o-mini";
}

function modelMatchesProvider(provider, model) {
  const value = String(model || "").toLowerCase();
  if (!value) return false;
  if (provider === "gemini") return value.startsWith("gemini-");
  if (provider === "anthropic") return value.startsWith("claude-");
  if (provider === "xai") return value.startsWith("grok-");
  return true;
}

function renderLineChart(container, points, unitLabel) {
  if (!container) return;
  if (!points.length) {
    container.innerHTML = `<div class="small">No data yet.</div>`;
    return;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 12;
  const width = 600;
  const height = 140;
  const step = (width - padding * 2) / (points.length - 1 || 1);
  const coords = points.map((point, index) => {
    const x = padding + index * step;
    const y = padding + ((max - point.value) / range) * (height - padding * 2);
    return { x, y, value: point.value, label: point.label };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`)
    .join(" ");

  const latest = coords[coords.length - 1];
  container.innerHTML = `
    <div class="chart-inner">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <path class="chart-path" d="${path}" fill="none" stroke-width="3" stroke-linecap="round" />
        ${coords
          .map((c) => `<circle class="chart-dot" cx="${c.x}" cy="${c.y}" r="2.5" />`)
          .join("")}
        <line class="chart-line" x1="${latest.x}" x2="${latest.x}" y1="${padding}" y2="${height - padding}" />
        <circle class="chart-focus" cx="${latest.x}" cy="${latest.y}" r="4" />
      </svg>
      <div class="chart-tooltip"></div>
    </div>
    <div class="small">Latest: ${formatNumber(latest.value, 1)} ${unitLabel}</div>
  `;

  const svg = container.querySelector("svg");
  const tooltip = container.querySelector(".chart-tooltip");
  const focus = container.querySelector(".chart-focus");
  const line = container.querySelector(".chart-line");

  const updateFocus = (idx) => {
    const point = coords[idx];
    if (!point) return;
    focus.setAttribute("cx", point.x);
    focus.setAttribute("cy", point.y);
    line.setAttribute("x1", point.x);
    line.setAttribute("x2", point.x);
    focus.style.opacity = "1";
    line.style.opacity = "1";
    tooltip.style.opacity = "1";
    tooltip.textContent = `${point.label}: ${formatNumber(point.value, 1)} ${unitLabel}`;

    const rect = svg.getBoundingClientRect();
    const left = (point.x / width) * rect.width;
    tooltip.style.left = `${left}px`;
  };

  updateFocus(coords.length - 1);

  svg.onmousemove = (event) => {
    const rect = svg.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const scaledX = (relativeX / rect.width) * width;
    const idx = Math.max(
      0,
      Math.min(coords.length - 1, Math.round((scaledX - padding) / (step || 1)))
    );
    updateFocus(idx);
  };

  svg.onmouseleave = () => {
    focus.style.opacity = "0";
    line.style.opacity = "0";
    tooltip.style.opacity = "0";
  };
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.length || row.length) {
        row.push(current);
        rows.push(row);
        row = [];
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

function normalizeDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  if (/^\d{10,13}$/.test(raw)) {
    const ms = raw.length === 10 ? Number(raw) * 1000 : Number(raw);
    const dt = new Date(ms);
    if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return null;
}

function findHeaderIndex(headers, keys) {
  for (const key of keys) {
    const idx = headers.findIndex((h) => h.includes(key));
    if (idx >= 0) return idx;
  }
  return -1;
}

function showSection(sectionName) {
  pageSections.forEach((section) => {
    section.classList.toggle("active", section.dataset.section === sectionName);
  });
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === sectionName);
  });

  if (sectionName === "home") todayTitle.textContent = "Today Overview";
  if (sectionName === "log") todayTitle.textContent = "Food Log";
  if (sectionName === "progress") todayTitle.textContent = "Progress";
  if (sectionName === "mealplan") todayTitle.textContent = "Meal Plan";
  if (sectionName === "plates") todayTitle.textContent = "Meal Plates";
  if (sectionName === "profile") todayTitle.textContent = "Profile & Targets";
  if (sectionName === "integrations") todayTitle.textContent = "Integrations";

  localStorage.setItem("activeSection", sectionName);
}

function calcScore(value, target) {
  if (!target || target <= 0) return null;
  const diff = Math.abs(value - target) / target;
  const score = Math.max(0, 100 - diff * 100);
  return Math.min(score, 100);
}

function computeDietScore(totals, targets) {
  if (!totals || !targets) return null;
  const scores = [];

  const calorieScore = calcScore(totals.calories, targets.calories);
  if (calorieScore !== null) scores.push({ value: calorieScore, weight: 0.35 });

  const proteinScore = calcScore(totals.protein, targets.protein);
  if (proteinScore !== null) scores.push({ value: proteinScore, weight: 0.2 });

  const carbScore = calcScore(totals.carbs, targets.carbs);
  if (carbScore !== null) scores.push({ value: carbScore, weight: 0.1 });

  const fatScore = calcScore(totals.fat, targets.fat);
  if (fatScore !== null) scores.push({ value: fatScore, weight: 0.1 });

  const fiberScore = targets.fiber
    ? Math.min((totals.fiber / targets.fiber) * 100, 100)
    : null;
  if (fiberScore !== null) scores.push({ value: fiberScore, weight: 0.1 });

  const sodiumScore = targets.sodium
    ? Math.max(0, 100 - Math.max((totals.sodium - targets.sodium) / targets.sodium, 0) * 100)
    : null;
  if (sodiumScore !== null) scores.push({ value: sodiumScore, weight: 0.1 });

  if (targets.daily_cost && targets.daily_cost > 0) {
    const costScore = calcScore(totals.cost || 0, targets.daily_cost);
    if (costScore !== null) scores.push({ value: costScore, weight: 0.05 });
  }

  if (!scores.length) return null;
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weighted = scores.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight;
  return Math.round(weighted);
}

function renderHomeInsights() {
  if (!dietScoreValue) return;
  const score = computeDietScore(state.totals, state.targets);
  if (score === null) {
    dietScoreValue.textContent = "--";
    dietScoreLabel.textContent = "Add a meal to score";
  } else {
    dietScoreValue.textContent = `${score}`;
    dietScoreLabel.textContent = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 55 ? "Fair" : "Needs focus";
  }

  if (state.summaryRange && state.summaryRange.length) {
    const daysLogged = state.summaryRange.filter((row) => row.calories > 0).length;
    consistencyValue.textContent = `${daysLogged}/7`;
    consistencyLabel.textContent = daysLogged >= 6 ? "Strong streak" : "Keep it going";
  } else {
    consistencyValue.textContent = "--";
    consistencyLabel.textContent = "No recent logs";
  }

  if (state.recommendation) {
    const rec = state.recommendation;
    if (rec.projectedDate) {
      projectionValue.textContent = rec.projectedDate;
      projectionLabel.textContent = rec.weeksToGoal
        ? `~${Math.round(rec.weeksToGoal * 7)} days`
        : "Goal timeline";
    } else if (rec.weeklyChangeKg) {
      projectionValue.textContent = `${Math.abs(rec.weeklyChangeKg)} kg/wk`;
      projectionLabel.textContent = rec.weeklyChangeKg > 0 ? "Estimated loss" : "Estimated gain";
    } else {
      projectionValue.textContent = "--";
      projectionLabel.textContent = "Add weight data";
    }
  }
}

function renderRationGrid() {
  if (!rationGrid) return;
  const currency = state.profile?.currency || "USD";
  const todayCost = state.totals?.cost || 0;
  const dailyTarget = state.targets?.daily_cost || 0;
  const recentCosts = (state.summaryRange || []).map((row) => row.cost || 0);
  const avgCost =
    recentCosts.length > 0
      ? recentCosts.reduce((sum, value) => sum + value, 0) / recentCosts.length
      : todayCost;
  const weeklyEstimate = avgCost ? avgCost * 7 : 0;
  const monthlyEstimate = avgCost ? avgCost * 30 : 0;
  const remaining = dailyTarget ? dailyTarget - todayCost : null;

  const cards = [
    {
      label: "Today cost",
      value: formatCurrency(todayCost || 0, currency),
      note: dailyTarget ? `Target ${formatCurrency(dailyTarget, currency)}` : "Set a cost target"
    },
    {
      label: "Remaining today",
      value: remaining !== null ? formatCurrency(remaining, currency) : "—",
      note: dailyTarget ? "Budget left" : "Enable daily cost target"
    },
    {
      label: "Weekly estimate",
      value: formatCurrency(weeklyEstimate || 0, currency),
      note: "Based on last 7 days"
    },
    {
      label: "Monthly estimate",
      value: formatCurrency(monthlyEstimate || 0, currency),
      note: "30-day projection"
    }
  ];

  rationGrid.innerHTML = cards
    .map(
      (card) => `
      <div class="ration-card">
        <div class="small">${card.label}</div>
        <strong>${card.value}</strong>
        <div class="small">${card.note}</div>
      </div>
    `
    )
    .join("");
}

function todayString(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (res.status === 401) {
    window.location.href = "/";
    return null;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const fallback = res.status === 413 ? "Upload too large. Try a smaller file." : "Request failed";
    throw new Error((data && data.error) || fallback);
  }
  return data;
}

function setUserName(name) {
  document.getElementById("userName").textContent = name;
}

function renderSummary(totals, targets) {
  if (!totals || !targets) return;
  const currency = state.profile?.currency || "USD";
  const items = [
    { label: "Calories", value: totals.calories, target: targets.calories, unit: "kcal" },
    { label: "Protein", value: totals.protein, target: targets.protein, unit: "g" },
    { label: "Carbs", value: totals.carbs, target: targets.carbs, unit: "g" },
    { label: "Fat", value: totals.fat, target: targets.fat, unit: "g" },
    { label: "Fiber", value: totals.fiber, target: targets.fiber, unit: "g" },
    { label: "Sodium", value: totals.sodium, target: targets.sodium, unit: "mg" },
    { label: "Cost", value: totals.cost, target: targets.daily_cost || 0, unit: currency, isCurrency: true }
  ];

  summaryCards.innerHTML = items
    .map((item) => {
      const percent = item.target ? Math.min((item.value / item.target) * 100, 120) : 0;
      const remaining = item.target - item.value;
      const valueLabel = item.isCurrency
        ? formatCurrency(item.value || 0, currency)
        : `${formatNumber(item.value, 1)} ${item.unit}`;
      const targetLabel = item.isCurrency
        ? formatCurrency(item.target || 0, currency)
        : `${formatNumber(item.target, 0)} ${item.unit}`;
      return `
        <div class="metric">
          <span class="small">${item.label}</span>
          <strong>${valueLabel}</strong>
          <span class="small">Target ${targetLabel} · ${item.isCurrency ? formatCurrency(remaining || 0, currency) : formatNumber(remaining, 0)} left</span>
          <div class="progress"><span style="width:${percent}%;"></span></div>
        </div>
      `;
    })
    .join("");

  const macroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
  if (macroCalories > 0) {
    const proteinPct = (totals.protein * 4) / macroCalories;
    const carbsPct = (totals.carbs * 4) / macroCalories;
    const fatPct = (totals.fat * 9) / macroCalories;
    const pStop = (proteinPct * 100).toFixed(1);
    const cStop = ((proteinPct + carbsPct) * 100).toFixed(1);
    macroSplit.style.width = "100%";
    macroSplit.style.background = `linear-gradient(90deg, #1b8a6b 0% ${pStop}%, #ff6f3c ${pStop}% ${cStop}%, #0c4a6e ${cStop}% 100%)`;
    if (macroSplitLabel) {
      macroSplitLabel.textContent = `Protein ${Math.round(proteinPct * 100)}% · Carbs ${Math.round(carbsPct * 100)}% · Fat ${Math.round(fatPct * 100)}%`;
    }
  } else {
    macroSplit.style.width = "0%";
    if (macroSplitLabel) {
      macroSplitLabel.textContent = "Add foods to see macro balance.";
    }
  }

  renderRationGrid();
}

function renderEntries(entries) {
  if (!entries.length) {
    entriesList.innerHTML = `<div class="small">No entries yet. Start by adding a food above.</div>`;
    return;
  }

  const favoriteIds = new Set(state.favorites.map((f) => f.id));
  entriesList.innerHTML = entries
    .map((entry) => {
      const isFavorite = favoriteIds.has(entry.food_id);
      let tag = "";
      if (entry.food_source === "ai") {
        const confidence = entry.food_confidence ? Math.round(entry.food_confidence * 100) : null;
        tag = `<span class=\"tag tag-ai\">AI estimate${confidence ? ` (${confidence}%)` : ""}</span>`;
      } else if (entry.food_source === "custom") {
        tag = `<span class=\"tag tag-custom\">Custom</span>`;
      }
      const costLabel = entry.cost && entry.cost > 0 ? ` · ${formatCurrency(entry.cost, state.profile?.currency || "USD")}` : "";
      return `
        <div class="entry">
          <div class="entry-header">
            <div>
              <strong>${entry.food_name}</strong>
              ${tag}
              <div class="small">${entry.grams}g · ${entry.meal}</div>
            </div>
            <div class="entry-actions">
              <button class="icon-btn ${isFavorite ? "active" : ""}" data-action="favorite" data-food-id="${entry.food_id}">★</button>
              <button class="icon-btn" data-action="delete" data-entry-id="${entry.id}">Delete</button>
            </div>
          </div>
          <div class="small">${formatNumber(entry.calories, 0)} kcal · P ${formatNumber(entry.protein, 1)}g · C ${formatNumber(entry.carbs, 1)}g · F ${formatNumber(entry.fat, 1)}g${costLabel}</div>
        </div>
      `;
    })
    .join("");
}

function renderFavorites(list) {
  if (!list.length) {
    favoriteList.innerHTML = `<span class="small">Add foods to favorites for quick access.</span>`;
    return;
  }
  favoriteList.innerHTML = list
    .map((food) => `<button class="chip" data-action="quick" data-food-id="${food.id}" data-food-name="${food.name}">${food.name}</button>`)
    .join("");
}

function renderRecent(list) {
  if (!list.length) {
    recentList.innerHTML = `<span class="small">Recent foods will show here.</span>`;
    return;
  }
  recentList.innerHTML = list
    .map((food) => `<button class="chip" data-action="quick" data-food-id="${food.food_id}" data-food-name="${food.food_name}">${food.food_name}</button>`)
    .join("");
}

function renderSuggestionList(list, container) {
  if (!list.length) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.innerHTML = list
    .map(
      (food) => `
      <div class="suggestion-item" data-id="${food.id}">
        <span>${food.name}</span>
        <span class="small">${formatNumber(food.calories, 0)} kcal/100g</span>
      </div>
    `
    )
    .join("");
  container.style.display = "block";
}

async function loadProfile() {
  const data = await api("/api/profile");
  if (!data || !data.user) return;
  setUserName(data.user.name);
  state.targets = data.targets;
  state.profile = data.profile;
  setAvatar(data.profile?.profile_image, data.user.name);

  profileName.value = data.user.name || "";
  profileEmail.value = data.user.email || "";
  profilePhone.value = data.user.phone || "";

  document.getElementById("targetCalories").value = data.targets.calories;
  document.getElementById("targetProtein").value = data.targets.protein;
  document.getElementById("targetCarbs").value = data.targets.carbs;
  document.getElementById("targetFat").value = data.targets.fat;
  document.getElementById("targetFiber").value = data.targets.fiber;
  document.getElementById("targetSodium").value = data.targets.sodium;
  targetCostInput.value = data.targets.daily_cost || 0;
  if (plannedCaloriesInput) {
    plannedCaloriesInput.value = data.targets.planned_calories || "";
  }

  if (data.profile) {
    profileSex.value = data.profile.sex || "unspecified";
    profileBirthYear.value = data.profile.birth_year || "";
    profileHeight.value = data.profile.height_cm ? Math.round(data.profile.height_cm) : "";
    profileHeightUnit.value = data.profile.height_unit || "cm";
    profileActivity.value = data.profile.activity_level || "moderate";
    profileGoal.value = data.profile.goal || "maintain";
    profileGoalWeight.value = data.profile.goal_weight_kg || "";
    profileWeightUnit.value = data.profile.weight_unit || "kg";
    profilePace.value = data.profile.pace_kg_per_week || 0.5;
    profileCurrency.value = data.profile.currency || "USD";
    weightUnit.value = data.profile.weight_unit || "kg";
    if (rationCurrency && !rationCurrency.value) {
      rationCurrency.value = data.profile.currency || "USD";
    }
  }

  if (data.visibility) {
    privacyName.checked = data.visibility.show_name === 1;
    privacyEmail.checked = data.visibility.show_email === 1;
    privacyPhone.checked = data.visibility.show_phone === 1;
    privacyHeight.checked = data.visibility.show_height === 1;
    privacyWeight.checked = data.visibility.show_weight === 1;
    privacyBmi.checked = data.visibility.show_bmi === 1;
    privacyMeasurements.checked = data.visibility.show_measurements === 1;
    privacyGoal.checked = data.visibility.show_goal === 1;
    privacyActivity.checked = data.visibility.show_activity === 1;
    if (privacyAvatar) privacyAvatar.checked = data.visibility.show_avatar === 1;
  }
}

async function loadSummary(date) {
  const data = await api(`/api/summary?date=${date}`);
  if (!data) return;
  state.totals = data.totals;
  state.targets = data.targets;
  renderSummary(data.totals, data.targets);
  renderHomeInsights();
}

async function loadEntries(date) {
  const entries = await api(`/api/entries?date=${date}`);
  if (!entries) return;
  state.entries = entries;
  renderEntries(entries);
}

async function loadFavorites() {
  const favs = await api("/api/favorites");
  if (!favs) return;
  state.favorites = favs;
  renderFavorites(state.favorites);
}

async function loadRecent() {
  const recents = await api("/api/recent");
  if (!recents) return;
  state.recent = recents;
  renderRecent(state.recent);
}

function renderRecommendation(data) {
  if (!data) {
    recommendationPanel.innerHTML = "";
    return;
  }

  const missing = data.missing || [];
  const lines = [];
  if (missing.length) {
    lines.push(`<div class="small">Missing: ${missing.join(", ")}. Add these to unlock full recommendations.</div>`);
  }
  if (data.bmi) lines.push(`<div class="small">BMI: <strong>${formatNumber(data.bmi, 1)}</strong></div>`);
  if (data.bmr) lines.push(`<div class="small">BMR: <strong>${formatNumber(data.bmr, 0)}</strong> kcal</div>`);
  if (data.tdee) lines.push(`<div class="small">TDEE: <strong>${formatNumber(data.tdee, 0)}</strong> kcal</div>`);
  if (data.suggestedCalories) {
    lines.push(`<div class="small">Suggested calories: <strong>${formatNumber(data.suggestedCalories, 0)}</strong> kcal</div>`);
  }
  if (data.projectionCalories) {
    const methodLabel = data.projectionMethod ? ` (${data.projectionMethod})` : "";
    lines.push(`<div class="small">Projection intake: <strong>${formatNumber(data.projectionCalories, 0)}</strong> kcal${methodLabel}</div>`);
  }
  if (data.suggestedMacros) {
    lines.push(`<div class="small">Suggested macros: P ${data.suggestedMacros.protein}g · C ${data.suggestedMacros.carbs}g · F ${data.suggestedMacros.fat}g</div>`);
  }
  if (data.weeklyChangeKg) {
    const sign = data.weeklyChangeKg > 0 ? "loss" : "gain";
    lines.push(`<div class="small">Projected weekly ${sign}: <strong>${Math.abs(data.weeklyChangeKg)} kg</strong></div>`);
    if (data.currentWeight) {
      const fourWeek = data.currentWeight - data.weeklyChangeKg * 4;
      lines.push(`<div class="small">4-week projection: <strong>${formatNumber(fourWeek, 1)} kg</strong></div>`);
    }
  }
  if (data.projectedDate) {
    lines.push(`<div class="small">Goal date estimate: <strong>${data.projectedDate}</strong></div>`);
  }

  recommendationPanel.innerHTML = `
    <div class="recommendation-card">
      <strong>Projection & Guidance</strong>
      ${lines.join("")}
      <div class="small" style="margin-top:8px;">Estimates are approximate and depend on consistent tracking.</div>
    </div>
  `;

  if (plannedCaloriesStatus) {
    if (data.impractical) {
      setStatus(plannedCaloriesStatus, data.impractical, "warning");
    } else {
      setStatus(plannedCaloriesStatus, "");
    }
  }

  if (plannedCaloriesInput && data.plannedCalories && !plannedCaloriesInput.value) {
    plannedCaloriesInput.value = data.plannedCalories;
  }
  if (plannedCaloriesInput && data.suggestedCalories) {
    plannedCaloriesInput.placeholder = `${Math.round(data.suggestedCalories)}`;
  }

  if (useSuggestedCalories && data.suggestedCalories) {
    if (data.plannedCalories) {
      useSuggestedCalories.checked = Math.abs(data.plannedCalories - data.suggestedCalories) <= 25;
    }
  }
}

function renderProfileMetrics() {
  if (!profileMetrics) return;
  const rec = state.recommendation;
  if (!rec) {
    profileMetrics.innerHTML = `<div class="small">Add weight, height, and birth year to see metrics.</div>`;
    return;
  }

  const metrics = [];
  if (rec.currentWeight) metrics.push({ label: "Current weight", value: `${formatNumber(rec.currentWeight, 1)} kg` });
  if (rec.bmi) metrics.push({ label: "BMI", value: `${formatNumber(rec.bmi, 1)}` });
  if (rec.bmr) metrics.push({ label: "BMR", value: `${formatNumber(rec.bmr, 0)} kcal` });
  if (rec.tdee) metrics.push({ label: "TDEE", value: `${formatNumber(rec.tdee, 0)} kcal` });
  if (rec.suggestedCalories) metrics.push({ label: "Suggested calories", value: `${formatNumber(rec.suggestedCalories, 0)} kcal` });
  if (rec.suggestedMacros) {
    metrics.push({
      label: "Suggested macros",
      value: `P ${rec.suggestedMacros.protein}g · C ${rec.suggestedMacros.carbs}g · F ${rec.suggestedMacros.fat}g`
    });
  }
  if (rec.projectedDate) metrics.push({ label: "Goal date", value: rec.projectedDate });
  if (rec.weeksToGoal) metrics.push({ label: "Days to goal", value: `${Math.round(rec.weeksToGoal * 7)} days` });

  if (!metrics.length) {
    profileMetrics.innerHTML = `<div class="small">Complete your profile to unlock metrics.</div>`;
    return;
  }

  profileMetrics.innerHTML = metrics
    .map(
      (metric) => `
      <div class="metric">
        <span class="small">${metric.label}</span>
        <strong>${metric.value}</strong>
      </div>
    `
    )
    .join("");
}

async function loadRecommendation() {
  const data = await api("/api/recommendation");
  if (!data) return;
  state.recommendation = data;
  renderRecommendation(data);
  renderHomeInsights();
  renderProfileMetrics();
}

async function loadAiSettings() {
  if (!aiSettingsForm) return;
  const data = await api("/api/ai/settings");
  if (!data) return;
  if (aiProvider) {
    aiProvider.value = data.provider || "openai";
    updateAiProviderUi(aiProvider.value);
  }
  aiEnabledToggle.checked = Boolean(data.enabled);
  aiModel.value = data.model || "";
  if (!aiModel.value || !modelMatchesProvider(aiProvider?.value || "openai", aiModel.value)) {
    aiModel.value = defaultModelForProvider(aiProvider?.value || "openai");
  }
  if (aiStatusMeta) {
    if (data.hasKey) {
      aiStatusMeta.textContent = `AI is available (${data.source}).`;
    } else {
      aiStatusMeta.textContent = "No API key detected yet.";
    }
  }
}

async function loadProfileQr() {
  const data = await api("/api/profile/qr");
  if (!data) return;
  publicProfileLink.href = data.publicUrl;
  publicProfileLink.textContent = data.publicUrl;
  profileQr.src = data.dataUrl;
}

function renderWeightChart() {
  const points = state.weights.map((row) => ({
    label: row.entry_date,
    value: row.weight_kg
  }));
  renderLineChart(weightChart, points, "kg");
}

function renderWaistChart() {
  const points = state.measurements
    .filter((row) => row.waist_cm)
    .map((row) => ({ label: row.entry_date, value: row.waist_cm }));
  renderLineChart(waistChart, points, "cm");
}

async function loadWeights() {
  const data = await api("/api/weights?days=120");
  if (!data) return;
  state.weights = data.rows || [];
  renderWeightChart();
}

async function loadMeasurements() {
  const data = await api("/api/measurements?days=180");
  if (!data) return;
  state.measurements = data.rows || [];
  renderWaistChart();
}

async function loadActivity() {
  const data = await api("/api/activity?days=120");
  if (!data) return;
  state.activity = data.rows || [];
  renderActivityCharts();
}

function renderActivityCharts() {
  const stepsPoints = state.activity
    .filter((row) => row.steps !== null && row.steps !== undefined)
    .map((row) => ({ label: row.entry_date, value: row.steps }));
  renderLineChart(stepsChart, stepsPoints, "steps");

  const sleepPoints = state.activity
    .filter((row) => row.sleep_hours !== null && row.sleep_hours !== undefined)
    .map((row) => ({ label: row.entry_date, value: row.sleep_hours }));
  renderLineChart(sleepChart, sleepPoints, "hrs");
}

async function loadCalorieTrend() {
  const data = await api("/api/summary-range?days=7");
  if (!data) return;
  state.summaryRange = data.rows || [];
  const points = state.summaryRange.map((row) => ({
    label: row.eaten_date,
    value: row.calories || 0
  }));
  renderLineChart(calorieTrendChart, points, "kcal");
  renderHomeInsights();
  renderRationGrid();
}

function renderPlateDraft() {
  if (!state.plateDraft.length) {
    plateItemList.innerHTML = `<div class="small">No items added yet.</div>`;
    return;
  }
  plateItemList.innerHTML = state.plateDraft
    .map((item, index) => `
      <div class="plate-item">
        <span>${item.foodName} · ${item.grams}g</span>
        <button data-index="${index}">Remove</button>
      </div>
    `)
    .join("");
}

function renderPlates() {
  if (!state.plates.length) {
    plateList.innerHTML = `<div class="small">No saved plates yet.</div>`;
    return;
  }
  plateList.innerHTML = state.plates
    .map((plate) => {
      const items = plate.items
        .map((item) => `${item.food_name} (${item.grams}g)`)
        .join(", ");
      return `
        <div class="entry">
          <div class="entry-header">
            <div>
              <strong>${plate.name}</strong>
              <div class="small">${items}</div>
            </div>
            <div class="entry-actions">
              <button class="icon-btn" data-action="log" data-plate-id="${plate.id}">Log</button>
              <button class="icon-btn" data-action="delete" data-plate-id="${plate.id}">Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderQuickPlates() {
  if (!quickPlateList) return;
  if (!state.plates.length) {
    quickPlateList.innerHTML = `<span class="small">Save plates to add them quickly.</span>`;
    return;
  }
  quickPlateList.innerHTML = state.plates
    .map(
      (plate) =>
        `<button class="chip" data-action="quick-plate" data-plate-id="${plate.id}">${plate.name}</button>`
    )
    .join("");
}

function clearRationForm() {
  rationEditingId = null;
  rationName.value = "";
  rationQty.value = "";
  rationUnit.value = "g";
  rationGramsPerUnit.value = "";
  rationCost.value = "";
  rationCurrency.value = state.profile?.currency || "USD";
  if (rationSaveBtn) rationSaveBtn.textContent = "Save Item";
}

function renderRations() {
  if (!rationList) return;
  if (!state.rations.length) {
    rationList.innerHTML = `<div class="small">No ration items yet.</div>`;
    return;
  }
  rationList.innerHTML = state.rations
    .map((item) => {
      const costLabel = item.cost_per_unit
        ? `${formatCurrency(item.cost_per_unit, item.currency || state.profile?.currency || "USD")} / ${item.unit}`
        : "No cost";
      const gramsInfo = item.grams_per_unit ? `· ${item.grams_per_unit}g/unit` : "";
      return `
        <div class="entry">
          <div class="entry-header">
            <div>
              <strong>${item.name}</strong>
              <div class="small">${formatNumber(item.quantity, 2)} ${item.unit} ${gramsInfo}</div>
              <div class="small">${costLabel}</div>
            </div>
            <div class="entry-actions">
              <button class="icon-btn" data-action="edit" data-id="${item.id}">Edit</button>
              <button class="icon-btn" data-action="delete" data-id="${item.id}">Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadRations() {
  if (!rationList) return;
  const data = await api("/api/rations");
  if (!data) return;
  state.rations = data;
  renderRations();
}

async function estimateRations() {
  if (!rationEstimate) return;
  setStatus(rationEstimateStatus, "");
  try {
    const data = await api("/api/rations/estimate?days=7");
    if (!data) return;
    if (!data.items.length) {
      rationEstimate.innerHTML = `<div class="small">Add ration items to see estimates.</div>`;
      return;
    }
    rationEstimate.innerHTML = data.items
      .map((item) => {
        const needed = item.needed_qty !== null ? `${formatNumber(item.needed_qty, 2)} ${item.unit}` : "N/A";
        const shortage = item.shortage_qty !== null ? `${formatNumber(item.shortage_qty, 2)} ${item.unit}` : "N/A";
        const cost = item.shortage_cost !== null
          ? formatCurrency(item.shortage_cost, item.currency || state.profile?.currency || "USD")
          : "--";
        return `
          <div class="entry">
            <strong>${item.name}</strong>
            <div class="small">Needed: ${needed} · Shortage: ${shortage}</div>
            <div class="small">Shortage cost: ${cost}</div>
          </div>
        `;
      })
      .join("");
    setStatus(
      rationEstimateStatus,
      `Estimated shortage cost: ${formatCurrency(
        data.total_shortage_cost || 0,
        state.profile?.currency || "USD"
      )}`,
      "success"
    );
  } catch (err) {
    setStatus(rationEstimateStatus, err.message || "Estimate failed.", "error");
  }
}

async function loadPlates() {
  const plates = await api("/api/plates");
  if (!plates) return;
  state.plates = plates;
  renderPlates();
  renderQuickPlates();
}

function renderMealPlan(plan) {
  if (!mealPlanDisplay) return;
  if (!plan || !plan.data) {
    mealPlanDisplay.innerHTML = `<div class="small">No meal plan yet. Generate one to get started.</div>`;
    if (mealPlanMeta) mealPlanMeta.textContent = "";
    return;
  }

  const data = plan.data;
  const metaParts = [];
  if (plan.source) metaParts.push(`Source: ${plan.source}`);
  if (plan.updated_at) metaParts.push(`Updated ${plan.updated_at}`);
  if (data.daily_targets) {
    metaParts.push(
      `Targets: ${formatNumber(data.daily_targets.calories, 0)} kcal · P ${formatNumber(
        data.daily_targets.protein,
        0
      )}g · C ${formatNumber(data.daily_targets.carbs, 0)}g · F ${formatNumber(
        data.daily_targets.fat,
        0
      )}g`
    );
  }
  if (mealPlanMeta) mealPlanMeta.textContent = metaParts.join(" · ");

  mealPlanDisplay.innerHTML = (data.days || [])
    .map(
      (day) => `
      <div class="meal-day">
        <h4>${day.day}</h4>
        <div class="small">Total ${formatNumber(day.total_calories, 0)} kcal</div>
        <div class="meal-items">
          ${(day.meals || [])
            .map(
              (meal) => `
              <div class="entry">
                <strong>${meal.name}</strong>
                <div class="small">${(meal.items || []).join(", ")}</div>
                <div class="small">P ${formatNumber(meal.protein, 0)}g · C ${formatNumber(
                meal.carbs,
                0
              )}g · F ${formatNumber(meal.fat, 0)}g · ${formatNumber(
                meal.calories,
                0
              )} kcal</div>
                <div class="small">${meal.notes || ""}</div>
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");

  const extras = [];
  if (data.shopping_list && data.shopping_list.length) {
    extras.push(
      `<div class="meal-day"><h4>Shopping List</h4><div class="small">${data.shopping_list.join(
        ", "
      )}</div></div>`
    );
  }
  if (data.tips && data.tips.length) {
    extras.push(
      `<div class="meal-day"><h4>Tips</h4><div class="small">${data.tips.join(" · ")}</div></div>`
    );
  }
  if (data.cautions && data.cautions.length) {
    extras.push(
      `<div class="meal-day"><h4>AI Cautions</h4><div class="small">${data.cautions.join(" · ")}</div></div>`
    );
  }
  if (extras.length) {
    mealPlanDisplay.innerHTML += extras.join("");
  }
}

async function loadMealPlan() {
  if (!mealPlanDisplay) return;
  const data = await api("/api/meal-plan");
  if (!data) return;
  state.mealPlan = data.plan;
  renderMealPlan(state.mealPlan);
  if (state.mealPlan?.preferences) {
    if (mealPlanPreferences && !mealPlanPreferences.value) {
      mealPlanPreferences.value = state.mealPlan.preferences.preferences || "";
    }
    if (mealPlanAvoid && !mealPlanAvoid.value) {
      mealPlanAvoid.value = state.mealPlan.preferences.avoid || "";
    }
    if (mealPlanUseRations) {
      mealPlanUseRations.checked = Boolean(state.mealPlan.preferences.useRationOnly);
    }
  }
  if (state.mealPlan?.healthNotes && mealPlanHealth && !mealPlanHealth.value) {
    mealPlanHealth.value = state.mealPlan.healthNotes;
  }
  if (!data.aiEnabled && mealPlanStatus) {
    setStatus(mealPlanStatus, "AI is disabled. Add an API key to generate meal plans.", "error");
  }
}

function updateFoodDetails(food) {
  if (!food) {
    foodDetails.textContent = "";
    return;
  }
  const costInfo = food.cost_per_100g && food.cost_per_100g > 0
    ? ` · Cost ${formatCurrency(food.cost_per_100g, food.currency || state.profile?.currency || "USD")}`
    : "";
  foodDetails.textContent = `Per 100g: ${formatNumber(food.calories, 0)} kcal · P ${formatNumber(food.protein, 1)}g · C ${formatNumber(food.carbs, 1)}g · F ${formatNumber(food.fat, 1)}g${costInfo}`;
}

let searchTimeout = null;
foodNameInput.addEventListener("input", () => {
  state.selectedFoodId = null;
  state.selectedFood = null;
  updateFoodDetails(null);
  if (searchTimeout) clearTimeout(searchTimeout);
  const query = foodNameInput.value.trim();
  if (!query) {
    renderSuggestionList([], suggestionList);
    return;
  }
  searchTimeout = setTimeout(async () => {
    const results = await api(`/api/foods?query=${encodeURIComponent(query)}`);
    state.suggestions = results;
    renderSuggestionList(results, suggestionList);
  }, 250);
});

suggestionList.addEventListener("click", (event) => {
  const item = event.target.closest(".suggestion-item");
  if (!item) return;
  const id = Number(item.dataset.id);
  const selected = state.suggestions.find((food) => food.id === id);
  if (!selected) return;
  state.selectedFoodId = selected.id;
  state.selectedFood = selected;
  foodNameInput.value = selected.name;
  renderSuggestionList([], suggestionList);
  updateFoodDetails(selected);
});

let plateSearchTimeout = null;
plateFoodName.addEventListener("input", () => {
  plateFoodName.dataset.foodId = "";
  if (plateSearchTimeout) clearTimeout(plateSearchTimeout);
  const query = plateFoodName.value.trim();
  if (!query) {
    renderSuggestionList([], plateSuggestionList);
    return;
  }
  plateSearchTimeout = setTimeout(async () => {
    const results = await api(`/api/foods?query=${encodeURIComponent(query)}`);
    state.plateSuggestions = results;
    renderSuggestionList(results, plateSuggestionList);
  }, 250);
});

plateSuggestionList.addEventListener("click", (event) => {
  const item = event.target.closest(".suggestion-item");
  if (!item) return;
  const id = Number(item.dataset.id);
  const selected = state.plateSuggestions.find((food) => food.id === id);
  if (!selected) return;
  plateFoodName.value = selected.name;
  plateFoodName.dataset.foodId = String(selected.id);
  renderSuggestionList([], plateSuggestionList);
});

async function addEntry(payload) {
  entryError.textContent = "";
  try {
    await api("/api/entries", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    foodGramsInput.value = "";
    state.selectedFoodId = null;
    state.selectedFood = null;
    updateFoodDetails(null);
    await reloadDay();
    await loadRecent();
  } catch (err) {
    if (err.message.includes("Food not found")) {
      state.pendingEntry = payload;
      openCustomFoodModal(payload.foodName || "");
      return;
    }
    entryError.textContent = err.message;
  }
}

async function reloadDay() {
  const date = datePicker.value;
  await Promise.all([loadSummary(date), loadEntries(date), loadFavorites()]);
  await loadCalorieTrend();
}

function openCustomFoodModal(name) {
  document.getElementById("customFoodName").value = name;
  document.getElementById("customCalories").value = "";
  document.getElementById("customProtein").value = "";
  document.getElementById("customCarbs").value = "";
  document.getElementById("customFat").value = "";
  document.getElementById("customFiber").value = "";
  document.getElementById("customSodium").value = "";
  document.getElementById("customFoodModal").classList.add("active");
}

function closeCustomFoodModal() {
  document.getElementById("customFoodModal").classList.remove("active");
  state.pendingEntry = null;
}

foodNameInput.addEventListener("blur", () => {
  setTimeout(() => renderSuggestionList([], suggestionList), 200);
});

entriesList.addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  if (action === "delete") {
    const entryId = event.target.dataset.entryId;
    await api(`/api/entries/${entryId}`, { method: "DELETE" });
    await reloadDay();
    return;
  }
  if (action === "favorite") {
    const foodId = Number(event.target.dataset.foodId);
    const favoriteIds = new Set(state.favorites.map((f) => f.id));
    if (favoriteIds.has(foodId)) {
      await api(`/api/favorites/${foodId}`, { method: "DELETE" });
    } else {
      await api("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ foodId })
      });
    }
    await loadFavorites();
    await loadEntries(datePicker.value);
  }
});

favoriteList.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-action='quick']");
  if (!btn) return;
  foodNameInput.value = btn.dataset.foodName;
  state.selectedFoodId = Number(btn.dataset.foodId);
  const selected = state.favorites.find((food) => food.id === state.selectedFoodId);
  state.selectedFood = selected || null;
  updateFoodDetails(selected);
  foodGramsInput.focus();
});

recentList.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-action='quick']");
  if (!btn) return;
  foodNameInput.value = btn.dataset.foodName;
  state.selectedFoodId = Number(btn.dataset.foodId);
  updateFoodDetails(null);
  foodGramsInput.focus();
});

plateFoodName.addEventListener("blur", () => {
  setTimeout(() => renderSuggestionList([], plateSuggestionList), 200);
});

addPlateItemBtn.addEventListener("click", () => {
  const name = plateFoodName.value.trim();
  const grams = Number(plateFoodGrams.value);
  if (!name || !grams) return;
  const foodId = plateFoodName.dataset.foodId ? Number(plateFoodName.dataset.foodId) : null;
  state.plateDraft.push({ foodId, foodName: name, grams });
  plateFoodName.value = "";
  plateFoodName.dataset.foodId = "";
  plateFoodGrams.value = "";
  renderPlateDraft();
});

plateItemList.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-index]");
  if (!btn) return;
  const index = Number(btn.dataset.index);
  state.plateDraft.splice(index, 1);
  renderPlateDraft();
});

savePlateBtn.addEventListener("click", async () => {
  const name = plateName.value.trim();
  if (!name || !state.plateDraft.length) return;
  await api("/api/plates", {
    method: "POST",
    body: JSON.stringify({ name, items: state.plateDraft })
  });
  state.plateDraft = [];
  plateName.value = "";
  renderPlateDraft();
  await loadPlates();
});

clearPlateBtn.addEventListener("click", () => {
  state.plateDraft = [];
  renderPlateDraft();
});

plateList.addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  const plateId = event.target.dataset.plateId;
  if (!action || !plateId) return;
  if (action === "delete") {
    await api(`/api/plates/${plateId}`, { method: "DELETE" });
    await loadPlates();
    return;
  }
  if (action === "log") {
    await api(`/api/plates/${plateId}/log`, {
      method: "POST",
      body: JSON.stringify({ eatenDate: datePicker.value, meal: plateMeal.value })
    });
    await reloadDay();
  }
});

if (quickPlateList) {
  quickPlateList.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-action='quick-plate']");
    if (!btn) return;
    const plateId = btn.dataset.plateId;
    if (!plateId) return;
    setStatus(quickPlateStatus, "");
    try {
      await api(`/api/plates/${plateId}/log`, {
        method: "POST",
        body: JSON.stringify({ eatenDate: datePicker.value, meal: quickPlateMeal.value })
      });
      await reloadDay();
      setStatus(quickPlateStatus, "Plate added to daily log.", "success");
    } catch (err) {
      setStatus(quickPlateStatus, err.message || "Failed to add plate.", "error");
    }
  });
}

document.getElementById("refreshPlates").addEventListener("click", loadPlates);

if (rationForm) {
  rationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(rationStatus, "");
    const payload = {
      name: rationName.value.trim(),
      quantity: rationQty.value,
      unit: rationUnit.value,
      gramsPerUnit: rationGramsPerUnit.value,
      costPerUnit: rationCost.value,
      currency: rationCurrency.value.trim()
    };
    if (!payload.name) {
      setStatus(rationStatus, "Enter a ration item name.", "error");
      return;
    }
    try {
      if (rationEditingId) {
        await api(`/api/rations/${rationEditingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setStatus(rationStatus, "Ration updated.", "success");
      } else {
        await api("/api/rations", { method: "POST", body: JSON.stringify(payload) });
        setStatus(rationStatus, "Ration saved.", "success");
      }
      clearRationForm();
      await loadRations();
      await estimateRations();
    } catch (err) {
      setStatus(rationStatus, err.message || "Failed to save ration.", "error");
    }
  });
}

if (rationClearBtn) {
  rationClearBtn.addEventListener("click", clearRationForm);
}

if (rationList) {
  rationList.addEventListener("click", async (event) => {
    const action = event.target.dataset.action;
    const id = event.target.dataset.id;
    if (!action || !id) return;
    if (action === "delete") {
      await api(`/api/rations/${id}`, { method: "DELETE" });
      await loadRations();
      await estimateRations();
      return;
    }
    if (action === "edit") {
      const item = state.rations.find((row) => String(row.id) === String(id));
      if (!item) return;
      rationEditingId = item.id;
      rationName.value = item.name;
      rationQty.value = item.quantity;
      rationUnit.value = item.unit;
      rationGramsPerUnit.value = item.grams_per_unit || "";
      rationCost.value = item.cost_per_unit || "";
      rationCurrency.value = item.currency || state.profile?.currency || "USD";
      if (rationSaveBtn) rationSaveBtn.textContent = "Update Item";
      setStatus(rationStatus, "Editing item. Update and save.", "warning");
    }
  });
}

if (rationEstimateBtn) {
  rationEstimateBtn.addEventListener("click", estimateRations);
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    showSection(btn.dataset.nav);
  });
});

importSamsung.addEventListener("click", async () => {
  importStatus.textContent = "";
  try {
    const file = samsungImportFile.files[0];
    if (!file) {
      importStatus.textContent = "Choose a CSV file first.";
      return;
    }
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      importStatus.textContent = "CSV is empty.";
      return;
    }
    const headers = rows.shift().map((h) => String(h || "").trim().toLowerCase());
    const type = importType.value;

    const dateIdx = findHeaderIndex(headers, ["day", "date", "start", "time", "create"]);
    if (dateIdx < 0) {
      importStatus.textContent = "Could not detect a date column.";
      return;
    }

    if (type === "weight") {
      const weightIdx = findHeaderIndex(headers, ["weight"]);
      if (weightIdx < 0) {
        importStatus.textContent = "Could not detect a weight column.";
        return;
      }
      const entries = rows
        .map((row) => {
          const entryDate = normalizeDate(row[dateIdx]);
          const weight = Number(row[weightIdx]);
          if (!entryDate || Number.isNaN(weight)) return null;
          return { entryDate, weight, unit: "kg" };
        })
        .filter(Boolean);
      if (!entries.length) {
        importStatus.textContent = "No valid weight rows found.";
        return;
      }
      await api("/api/weights/bulk", { method: "POST", body: JSON.stringify({ entries }) });
      await loadWeights();
      importStatus.textContent = `Imported ${entries.length} weight rows.`;
      return;
    }

    if (type === "steps" || type === "sleep") {
      const stepsIdx = findHeaderIndex(headers, ["step", "count"]);
      const sleepIdx = findHeaderIndex(headers, ["sleep", "duration"]);
      const entries = rows
        .map((row) => {
          const entryDate = normalizeDate(row[dateIdx]);
          if (!entryDate) return null;
          const steps = stepsIdx >= 0 ? Number(row[stepsIdx]) : null;
          let sleepHours = sleepIdx >= 0 ? Number(row[sleepIdx]) : null;
          if (sleepHours && sleepHours > 24) sleepHours = sleepHours / 60;
          return {
            entryDate,
            steps: Number.isNaN(steps) ? null : steps,
            sleepHours: Number.isNaN(sleepHours) ? null : sleepHours
          };
        })
        .filter((entry) => entry && (entry.steps !== null || entry.sleepHours !== null));

      if (!entries.length) {
        importStatus.textContent = "No valid rows found for steps/sleep.";
        return;
      }
      await api("/api/activity/bulk", { method: "POST", body: JSON.stringify({ entries }) });
      await loadActivity();
      importStatus.textContent = `Imported ${entries.length} activity rows.`;
      return;
    }
  } catch (err) {
    importStatus.textContent = err.message || "Import failed";
  }
});

if (aiSettingsForm) {
  aiSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(aiStatus, "");
    const payload = {
      apiKey: aiApiKey.value.trim(),
      model: aiModel.value.trim(),
      enabled: aiEnabledToggle.checked,
      provider: aiProvider ? aiProvider.value : "openai"
    };
    if (!payload.apiKey) delete payload.apiKey;
    try {
      await api("/api/ai/settings", { method: "PUT", body: JSON.stringify(payload) });
      aiApiKey.value = "";
      await loadAiSettings();
      await loadMealPlan();
      setStatus(aiStatus, "AI settings saved.", "success");
    } catch (err) {
      setStatus(aiStatus, err.message || "Failed to save AI settings.", "error");
    }
  });
}

if (aiProvider) {
  aiProvider.addEventListener("change", () => {
    updateAiProviderUi(aiProvider.value);
    if (!modelMatchesProvider(aiProvider.value, aiModel.value)) {
      aiModel.value = defaultModelForProvider(aiProvider.value);
      setStatus(aiStatus, "Model updated to match provider.", "warning");
    }
  });
}

if (aiClearKey) {
  aiClearKey.addEventListener("click", async () => {
    setStatus(aiStatus, "");
    try {
      await api("/api/ai/settings", {
        method: "PUT",
        body: JSON.stringify({
          clearKey: true,
          enabled: false,
          provider: aiProvider ? aiProvider.value : "openai"
        })
      });
      aiApiKey.value = "";
      await loadAiSettings();
      await loadMealPlan();
      setStatus(aiStatus, "AI key cleared.", "success");
    } catch (err) {
      setStatus(aiStatus, err.message || "Failed to clear AI key.", "error");
    }
  });
}

if (aiValidateKey) {
  aiValidateKey.addEventListener("click", async () => {
    setStatus(aiStatus, "");
    try {
      await api("/api/ai/validate", {
        method: "POST",
        body: JSON.stringify({
          provider: aiProvider ? aiProvider.value : "openai",
          apiKey: aiApiKey.value.trim(),
          model: aiModel.value.trim()
        })
      });
      setStatus(aiStatus, "API key is valid.", "success");
    } catch (err) {
      setStatus(aiStatus, err.message || "API key validation failed.", "error");
    }
  });
}

const addEntryForm = document.getElementById("addEntryForm");
addEntryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const grams = foodGramsInput.value;
  const foodName = foodNameInput.value.trim();
  const eatenDate = datePicker.value;

  if (!foodName || !grams) {
    entryError.textContent = "Please enter both a food name and grams.";
    return;
  }

  await addEntry({
    foodId: state.selectedFoodId,
    foodName,
    grams,
    eatenDate,
    meal: mealTypeInput.value
  });
});

const targetsForm = document.getElementById("targetsForm");
targetsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(targetsStatus, "");
  const payload = {
    calories: document.getElementById("targetCalories").value,
    protein: document.getElementById("targetProtein").value,
    carbs: document.getElementById("targetCarbs").value,
    fat: document.getElementById("targetFat").value,
    fiber: document.getElementById("targetFiber").value,
    sodium: document.getElementById("targetSodium").value,
    dailyCost: targetCostInput.value
  };
  try {
    await api("/api/targets", { method: "PUT", body: JSON.stringify(payload) });
    await loadSummary(datePicker.value);
    await loadRecommendation();
    setStatus(targetsStatus, "Targets updated.", "success");
  } catch (err) {
    setStatus(targetsStatus, err.message || "Failed to update targets.", "error");
  }
});

if (savePlannedCalories) {
  savePlannedCalories.addEventListener("click", async () => {
    if (!plannedCaloriesInput) return;
    const raw = plannedCaloriesInput.value;
    setStatus(plannedCaloriesStatus, "");
    try {
      const updated = await api("/api/targets", {
        method: "PUT",
        body: JSON.stringify({ plannedCalories: raw })
      });
      if (updated) {
        state.targets = { ...(state.targets || {}), planned_calories: updated.planned_calories };
      }
      await loadRecommendation();
      if (state.recommendation?.impractical) {
        setStatus(plannedCaloriesStatus, state.recommendation.impractical, "warning");
      } else {
        setStatus(plannedCaloriesStatus, "Projection updated.", "success");
      }
    } catch (err) {
      setStatus(plannedCaloriesStatus, err.message || "Failed to update projection.", "error");
    }
  });
}

if (useSuggestedCalories) {
  useSuggestedCalories.addEventListener("change", async () => {
    if (!useSuggestedCalories.checked) return;
    if (!state.recommendation?.suggestedCalories) {
      setStatus(plannedCaloriesStatus, "Suggested calories unavailable.", "error");
      return;
    }
    plannedCaloriesInput.value = Math.round(state.recommendation.suggestedCalories);
    if (savePlannedCalories) savePlannedCalories.click();
  });
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(profileStatus, "");
  const payload = {
    name: profileName.value,
    phone: profilePhone.value,
    sex: profileSex.value,
    birthYear: profileBirthYear.value,
    height: profileHeight.value,
    heightUnit: profileHeightUnit.value,
    activityLevel: profileActivity.value,
    goal: profileGoal.value,
    goalWeight: profileGoalWeight.value,
    weightUnit: profileWeightUnit.value,
    paceKgPerWeek: profilePace.value,
    currency: profileCurrency.value
  };
  try {
    const profile = await api("/api/profile", { method: "PUT", body: JSON.stringify(payload) });
    state.profile = profile;
    setUserName(profileName.value || "User");
    setAvatar(profile?.profile_image, profileName.value || "User");
    await loadSummary(datePicker.value);
    await loadRecommendation();
    await loadProfileQr();
    setStatus(profileStatus, "Profile saved.", "success");
  } catch (err) {
    setStatus(profileStatus, err.message || "Failed to save profile.", "error");
  }
});

document.getElementById("suggestTargets").addEventListener("click", async () => {
  const data = await api("/api/recommendation");
  renderRecommendation(data);
  if (data.suggestedCalories) {
    document.getElementById("targetCalories").value = data.suggestedCalories;
  }
  if (data.suggestedMacros) {
    document.getElementById("targetProtein").value = data.suggestedMacros.protein;
    document.getElementById("targetCarbs").value = data.suggestedMacros.carbs;
    document.getElementById("targetFat").value = data.suggestedMacros.fat;
  }
});

if (profileAvatarInput) {
  profileAvatarInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1200000) {
      setStatus(avatarStatus, "Image too large. Use a smaller photo.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingAvatarData = reader.result;
      if (profileAvatarPreview) profileAvatarPreview.src = pendingAvatarData;
      setStatus(avatarStatus, "Photo ready. Click save to upload.", "success");
    };
    reader.readAsDataURL(file);
  });
}

if (saveAvatarBtn) {
  saveAvatarBtn.addEventListener("click", async () => {
    if (!pendingAvatarData) {
      setStatus(avatarStatus, "Choose a photo first.", "error");
      return;
    }
    setStatus(avatarStatus, "");
    try {
      const result = await api("/api/profile/avatar", {
        method: "PUT",
        body: JSON.stringify({ image: pendingAvatarData })
      });
      state.profile = { ...state.profile, profile_image: result.profile_image };
      setAvatar(result.profile_image, profileName.value || "User");
      pendingAvatarData = null;
      setStatus(avatarStatus, "Photo saved.", "success");
    } catch (err) {
      setStatus(avatarStatus, err.message || "Failed to save photo.", "error");
    }
  });
}

privacyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    show_name: privacyName.checked,
    show_email: privacyEmail.checked,
    show_phone: privacyPhone.checked,
    show_height: privacyHeight.checked,
    show_weight: privacyWeight.checked,
    show_bmi: privacyBmi.checked,
    show_measurements: privacyMeasurements.checked,
    show_goal: privacyGoal.checked,
    show_activity: privacyActivity.checked,
    show_avatar: privacyAvatar ? privacyAvatar.checked : false
  };
  await api("/api/profile/privacy", { method: "PUT", body: JSON.stringify(payload) });
  await loadProfileQr();
});

if (mealPlanForm) {
  mealPlanForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(mealPlanStatus, "");
    const health = mealPlanHealth.value.trim();
    if (!health) {
      setStatus(mealPlanStatus, "Please list health complications (or type 'none').", "error");
      return;
    }
    const payload = {
      healthComplications: health,
      preferences: mealPlanPreferences.value.trim(),
      avoid: mealPlanAvoid.value.trim(),
      useRationOnly: mealPlanUseRations.checked,
      previousPlanId: state.mealPlan?.id || null
    };
    try {
      const result = await api("/api/meal-plan/generate", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      state.mealPlan = result.plan;
      renderMealPlan(state.mealPlan);
      setStatus(mealPlanStatus, "Meal plan generated.", "success");
    } catch (err) {
      setStatus(mealPlanStatus, err.message || "Meal plan generation failed.", "error");
    }
  });
}

if (mealPlanRegenerate) {
  mealPlanRegenerate.addEventListener("click", async () => {
    if (!mealPlanForm) return;
    mealPlanForm.requestSubmit();
  });
}

if (mealPlanEditToggle) {
  mealPlanEditToggle.addEventListener("click", () => {
    if (!mealPlanEditorWrap) return;
    const isOpen = mealPlanEditorWrap.style.display !== "none";
    mealPlanEditorWrap.style.display = isOpen ? "none" : "block";
    if (!isOpen && mealPlanEditor && state.mealPlan?.data) {
      mealPlanEditor.value = JSON.stringify(state.mealPlan.data, null, 2);
    }
  });
}

if (mealPlanSave) {
  mealPlanSave.addEventListener("click", async () => {
    if (!state.mealPlan?.id) {
      setStatus(mealPlanStatus, "Generate a plan first.", "error");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(mealPlanEditor.value);
    } catch {
      setStatus(mealPlanStatus, "Invalid JSON. Please fix and try again.", "error");
      return;
    }
    try {
      await api(`/api/meal-plan/${state.mealPlan.id}`, {
        method: "PUT",
        body: JSON.stringify({ data: parsed })
      });
      state.mealPlan = { ...state.mealPlan, data: parsed };
      renderMealPlan(state.mealPlan);
      setStatus(mealPlanStatus, "Meal plan updated.", "success");
    } catch (err) {
      setStatus(mealPlanStatus, err.message || "Failed to save plan.", "error");
    }
  });
}

const customFoodForm = document.getElementById("customFoodForm");
customFoodForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: document.getElementById("customFoodName").value.trim(),
    calories: document.getElementById("customCalories").value,
    protein: document.getElementById("customProtein").value,
    carbs: document.getElementById("customCarbs").value,
    fat: document.getElementById("customFat").value,
    fiber: document.getElementById("customFiber").value,
    sodium: document.getElementById("customSodium").value,
    cost_per_100g: document.getElementById("customCost").value,
    currency: document.getElementById("customCurrency").value || (state.profile?.currency || "USD")
  };

  const food = await api("/api/foods", { method: "POST", body: JSON.stringify(payload) });
  closeCustomFoodModal();

  if (state.pendingEntry) {
    await addEntry({
      ...state.pendingEntry,
      foodId: food.id,
      foodName: food.name
    });
  }
});

document.getElementById("cancelCustom").addEventListener("click", closeCustomFoodModal);

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
});

document.getElementById("refreshFavorites").addEventListener("click", loadFavorites);

document.getElementById("exportCsv").addEventListener("click", () => {
  if (!state.entries.length) return;
  const headers = [
    "Food",
    "Grams",
    "Calories",
    "Protein",
    "Carbs",
    "Fat",
    "Fiber",
    "Sodium",
    "Cost",
    "Meal",
    "Date"
  ];
  const rows = state.entries.map((entry) => [
    entry.food_name,
    entry.grams,
    entry.calories,
    entry.protein,
    entry.carbs,
    entry.fat,
    entry.fiber,
    entry.sodium,
    entry.cost,
    entry.meal,
    entry.eaten_date
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `calorie-log-${datePicker.value}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

weightForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(weightStatus, "");
  const payload = {
    weight: weightValue.value,
    unit: weightUnit.value,
    entryDate: weightDate.value
  };
  if (!payload.weight || !payload.entryDate) {
    setStatus(weightStatus, "Add weight and date.", "error");
    return;
  }
  try {
    await api("/api/weights", { method: "POST", body: JSON.stringify(payload) });
    await loadWeights();
    await loadRecommendation();
    setStatus(weightStatus, "Weight saved.", "success");
  } catch (err) {
    setStatus(weightStatus, err.message || "Failed to save weight.", "error");
  }
});

measureForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(measureStatus, "");
  const payload = {
    unit: measureUnit.value,
    entryDate: measureDate.value,
    waist: measureWaist.value,
    chest: measureChest.value,
    hip: measureHip.value,
    thigh: measureThigh.value,
    arm: measureArm.value,
    neck: measureNeck.value
  };
  const hasValue = [payload.waist, payload.chest, payload.hip, payload.thigh, payload.arm, payload.neck].some(
    (value) => value && Number(value) > 0
  );
  if (!payload.entryDate || !hasValue) {
    setStatus(measureStatus, "Add a date and at least one measurement.", "error");
    return;
  }
  try {
    await api("/api/measurements", { method: "POST", body: JSON.stringify(payload) });
    await loadMeasurements();
    setStatus(measureStatus, "Measurements saved.", "success");
  } catch (err) {
    setStatus(measureStatus, err.message || "Failed to save measurements.", "error");
  }
});

activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(activityStatus, "");
  const payload = {
    entryDate: activityDate.value,
    steps: activitySteps.value,
    sleepHours: activitySleep.value,
    restingHr: activityRhr.value,
    activeCalories: activityCalories.value
  };
  const hasMetric = [payload.steps, payload.sleepHours, payload.restingHr, payload.activeCalories].some(
    (value) => value && Number(value) > 0
  );
  if (!payload.entryDate || !hasMetric) {
    setStatus(activityStatus, "Add a date and at least one activity metric.", "error");
    return;
  }
  try {
    await api("/api/activity", { method: "POST", body: JSON.stringify(payload) });
    await loadActivity();
    setStatus(activityStatus, "Activity saved.", "success");
  } catch (err) {
    setStatus(activityStatus, err.message || "Failed to save activity.", "error");
  }
});

datePicker.addEventListener("change", async () => {
  const date = datePicker.value;
  todayDate.textContent = new Date(date).toDateString();
  weightDate.value = date;
  measureDate.value = date;
  activityDate.value = date;
  await reloadDay();
});

async function init() {
  const today = todayString();
  datePicker.value = today;
  todayDate.textContent = new Date(today).toDateString();
  weightDate.value = today;
  measureDate.value = today;
  activityDate.value = today;
  await loadProfile();
  await loadAiSettings();
  await reloadDay();
  await loadRecent();
  await loadWeights();
  await loadMeasurements();
  await loadActivity();
  await loadPlates();
  await loadRations();
  await estimateRations();
  await loadMealPlan();
  await loadRecommendation();
  await loadCalorieTrend();
  await loadProfileQr();
  renderPlateDraft();

  const savedSection = localStorage.getItem("activeSection") || "home";
  showSection(savedSection);
}

init();
