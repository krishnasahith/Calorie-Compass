import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import twilio from "twilio";
import db from "./db.js";
import { estimateFoodMacros, aiEnabled, generateMealPlan, validateAiKey } from "./ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const NODE_ENV = process.env.NODE_ENV || "development";

if (NODE_ENV === "production") {
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));
}

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 80 });
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 12 });

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth", authLimiter);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "14d" }
  );
}

function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function clampNumber(value, min, max) {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
}

function sanitizeModel(model) {
  const cleaned = String(model || "").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 64);
}

async function getAiSettings(userId) {
  const row = await db.get(
    "SELECT provider, api_key, model, enabled FROM ai_settings WHERE user_id = ?",
    userId
  );
  if (!row) return {};
  const provider = row.provider || "openai";
  const normalized = normalizeModelForProvider(provider, row.model || "");
  const model = modelMatchesProvider(provider, normalized)
    ? normalized
    : defaultModelForProvider(provider);
  return {
    provider,
    apiKey: row.api_key || null,
    model: model || null,
    enabled: row.enabled === 1
  };
}

function envKeyForProvider(provider) {
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "xai":
      return process.env.XAI_API_KEY;
    case "openai":
    default:
      return process.env.OPENAI_API_KEY;
  }
}

function defaultModelForProvider(provider) {
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_MODEL || "gemini-2.5-flash";
    case "anthropic":
      return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
    case "xai":
      return process.env.XAI_MODEL || "grok-4-1-fast-reasoning";
    case "openai":
    default:
      return process.env.OPENAI_MODEL || "gpt-4o-mini";
  }
}

function normalizeModelForProvider(provider, model) {
  const cleaned = String(model || "").trim();
  if (!cleaned) return null;
  if (provider === "gemini" && cleaned.startsWith("models/")) {
    return cleaned.replace(/^models\//, "");
  }
  return cleaned;
}

function modelMatchesProvider(provider, model) {
  if (!model) return false;
  const m = String(model).toLowerCase();
  if (provider === "gemini") return m.startsWith("gemini-");
  if (provider === "anthropic") return m.startsWith("claude-");
  if (provider === "xai") return m.startsWith("grok-");
  return true;
}

function pickItems(list, startIndex, count) {
  if (!list.length) return [];
  const items = [];
  for (let i = 0; i < count; i += 1) {
    items.push(list[(startIndex + i) % list.length]);
  }
  return items;
}

function filterAvoid(list, avoidText) {
  const terms = String(avoidText || "")
    .toLowerCase()
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!terms.length) return list;
  return list.filter((item) => !terms.some((term) => item.toLowerCase().includes(term)));
}

function categorizeFoods(foods) {
  const buckets = { breakfast: [], lunch: [], dinner: [], snack: [], all: [] };
  const list = foods || [];
  for (const item of list) {
    const name = item.toLowerCase();
    buckets.all.push(item);
    if (/(oat|egg|yogurt|milk|cereal|toast|pancake|idli|dosa|poha)/.test(name)) {
      buckets.breakfast.push(item);
      continue;
    }
    if (/(nut|fruit|banana|apple|bar|snack|trail|peanut)/.test(name)) {
      buckets.snack.push(item);
      continue;
    }
    if (/(rice|chicken|beef|fish|dal|lentil|curry|pasta|salad|tofu|paneer|roti|chapati|quinoa)/.test(name)) {
      buckets.lunch.push(item);
      buckets.dinner.push(item);
      continue;
    }
    buckets.lunch.push(item);
    buckets.dinner.push(item);
  }
  return buckets;
}

function buildFallbackMealPlan(input) {
  const defaults = {
    calories: 2000,
    protein: 140,
    carbs: 220,
    fat: 70,
    fiber: 25
  };

  const targets = input?.targets || {};
  const profile = input?.profile || {};
  const macroFallback =
    macroSuggestion(profile.current_weight_kg, targets.calories || defaults.calories, profile.goal) || null;

  const dailyTargets = {
    calories: Number(targets.calories || defaults.calories),
    protein: Number(targets.protein || macroFallback?.protein || defaults.protein),
    carbs: Number(targets.carbs || macroFallback?.carbs || defaults.carbs),
    fat: Number(targets.fat || macroFallback?.fat || defaults.fat),
    fiber: Number(targets.fiber || defaults.fiber)
  };

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const distribution = {
    breakfast: 0.25,
    lunch: 0.3,
    dinner: 0.3,
    snack: 0.15
  };

  const defaultFoods = [
    "Oats",
    "Eggs",
    "Greek yogurt",
    "Rice",
    "Chicken breast",
    "Mixed vegetables",
    "Lentils",
    "Salad",
    "Nuts",
    "Fruit"
  ];

  const foods = filterAvoid((input?.foods || []).length ? input.foods : defaultFoods, input?.avoid);
  const plates = filterAvoid(input?.plates || [], input?.avoid);
  const buckets = categorizeFoods(foods);

  const breakfastPool = buckets.breakfast.length ? buckets.breakfast : foods;
  const lunchPool = buckets.lunch.length ? buckets.lunch : foods;
  const dinnerPool = buckets.dinner.length ? buckets.dinner : foods;
  const snackPool = buckets.snack.length ? buckets.snack : ["Fruit", "Nuts", "Greek yogurt"];

  const days = dayNames.map((day, index) => {
    const breakfastItems = pickItems(breakfastPool, index, 2);
    const lunchItems = input?.useRationOnly && plates.length
      ? pickItems(plates, index, 1)
      : pickItems(lunchPool, index + 1, 2);
    const dinnerItems = input?.useRationOnly && plates.length
      ? pickItems(plates, index + 1, 1)
      : pickItems(dinnerPool, index + 2, 2);
    const snackItems = pickItems(snackPool, index, 1);

    const mealFor = (name, items, ratio) => ({
      name,
      items,
      calories: round(dailyTargets.calories * ratio, 0),
      protein: round(dailyTargets.protein * ratio, 0),
      carbs: round(dailyTargets.carbs * ratio, 0),
      fat: round(dailyTargets.fat * ratio, 0),
      notes: "Adjust portions to match your daily targets."
    });

    const meals = [
      mealFor("Breakfast", breakfastItems, distribution.breakfast),
      mealFor("Lunch", lunchItems, distribution.lunch),
      mealFor("Dinner", dinnerItems, distribution.dinner),
      mealFor("Snack", snackItems, distribution.snack)
    ];

    return {
      day,
      total_calories: dailyTargets.calories,
      meals
    };
  });

  const shopping = Array.from(new Set([...foods, ...plates])).slice(0, 24);

  const cautions = [
    "This is a fallback auto-generated plan. Adjust portions and consult a professional if needed."
  ];
  if (input?.healthComplications && input.healthComplications.toLowerCase() !== "none") {
    cautions.push(`Health note: ${input.healthComplications}`);
  }
  if (input?.aiFailure) {
    cautions.push(`AI unavailable: ${input.aiFailure}`);
  }

  return {
    summary: `Baseline plan based on your targets${input?.preferences ? " and preferences" : ""}.`,
    daily_targets: dailyTargets,
    days,
    shopping_list: shopping,
    tips: [
      "Aim for protein at each meal.",
      "Include vegetables or fruit daily.",
      "Stay consistent with portion sizes."
    ],
    cautions
  };
}

function normalizePhone(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) {
    return "+" + raw.slice(1).replace(/\D/g, "");
  }
  return raw.replace(/\D/g, "");
}

function isEmail(value) {
  return /.+@.+\..+/.test(value);
}

function getContactInfo(contact) {
  const trimmed = String(contact || "").trim();
  if (!trimmed) return null;
  if (isEmail(trimmed)) {
    return { type: "email", value: normalizeEmail(trimmed) };
  }
  const phone = normalizePhone(trimmed);
  if (phone.length >= 7) return { type: "phone", value: phone };
  return null;
}

function createCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === "production"
  };
}

function otpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const mailTransport =
  process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    : null;

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

async function sendOtpMessage(contact, code) {
  if (contact.type === "email") {
    if (mailTransport && process.env.SMTP_FROM) {
      await mailTransport.sendMail({
        from: process.env.SMTP_FROM,
        to: contact.value,
        subject: "Your Calorie Compass OTP",
        text: `Your verification code is ${code}. It expires in 10 minutes.`
      });
      return { ok: true };
    }
    if (NODE_ENV !== "production") {
      console.log(`DEV OTP for ${contact.value}: ${code}`);
      return { ok: true, dev: true };
    }
    return { ok: false, error: "Email provider not configured" };
  }

  if (contact.type === "phone") {
    if (twilioClient && process.env.TWILIO_FROM) {
      await twilioClient.messages.create({
        to: contact.value,
        from: process.env.TWILIO_FROM,
        body: `Your Calorie Compass code is ${code}. It expires in 10 minutes.`
      });
      return { ok: true };
    }
    if (NODE_ENV !== "production") {
      console.log(`DEV SMS OTP for ${contact.value}: ${code}`);
      return { ok: true, dev: true };
    }
    return { ok: false, error: "SMS provider not configured" };
  }

  return { ok: false, error: "Invalid contact" };
}

function toKg(value, unit = "kg") {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (unit === "lb") return num / 2.20462;
  return num;
}

function toCm(value, unit = "cm") {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (unit === "in") return num * 2.54;
  if (unit === "m") return num * 100;
  return num;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function calcBmr({ sex, weightKg, heightCm, age }) {
  if (!weightKg || !heightCm || !age) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78;
}

function activityMultiplier(level) {
  switch (level) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "very":
      return 1.725;
    case "athlete":
      return 1.9;
    case "moderate":
    default:
      return 1.55;
  }
}

function macroSuggestion(weightKg, calories, goal = "maintain") {
  if (!weightKg || !calories) return null;
  const proteinPerKg = goal === "gain" ? 1.8 : 1.6;
  const fatPerKg = 0.8;
  const protein = round(weightKg * proteinPerKg, 0);
  const fat = round(weightKg * fatPerKg, 0);
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const remainingCals = Math.max(calories - proteinCals - fatCals, 0);
  const carbs = round(remainingCals / 4, 0);
  return { protein, fat, carbs };
}

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone || "");
  const password = String(req.body.password || "");

  if (!name || !email || password.length < 6) {
    return res.status(400).json({
      error: "Name, valid email, and password (6+ chars) are required"
    });
  }

  const existing = await db.get("SELECT id FROM users WHERE email = ?", email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }
  if (phone) {
    const phoneExisting = await db.get("SELECT id FROM users WHERE phone = ?", phone);
    if (phoneExisting) {
      return res.status(409).json({ error: "Phone already registered" });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const result = await db.run(
    "INSERT INTO users (name, email, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    name,
    email,
    phone || null,
    passwordHash,
    now
  );

  const userId = result.lastID;
  await db.run(
    `INSERT INTO targets (user_id, calories, protein, carbs, fat, fiber, sodium, daily_cost, planned_calories)
     VALUES (?, 2000, 140, 220, 70, 28, 2300, 0, NULL)`,
    userId
  );

  await db.run(
    `INSERT INTO profiles
      (user_id, sex, birth_year, height_cm, activity_level, goal, goal_weight_kg, pace_kg_per_week, weight_unit, height_unit, currency, profile_image)
     VALUES (?, 'unspecified', NULL, NULL, 'moderate', 'maintain', NULL, 0.5, 'kg', 'cm', 'USD', NULL)`,
    userId
  );

  await db.run(
    `INSERT INTO profile_visibility
      (user_id, show_name, show_email, show_phone, show_height, show_weight, show_bmi, show_measurements, show_goal, show_activity, show_avatar)
     VALUES (?, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
    userId
  );

  const token = createToken({ id: userId, email, name });
  res.cookie("token", token, createCookieOptions());
  return res.json({ id: userId, name, email });
});

app.post("/api/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  const user = await db.get(
    "SELECT id, name, email, password_hash FROM users WHERE email = ?",
    email
  );

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = createToken(user);
  res.cookie("token", token, createCookieOptions());
  return res.json({ id: user.id, name: user.name, email: user.email });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

app.post("/api/auth/request-otp", otpLimiter, async (req, res) => {
  const contact = getContactInfo(req.body.contact);
  if (!contact) return res.status(400).json({ error: "Enter a valid email or phone" });

  const now = new Date();
  const recent = await db.get(
    `SELECT created_at FROM otp_codes
     WHERE contact_type = ? AND contact_value = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    contact.type,
    contact.value
  );
  if (recent) {
    const last = new Date(recent.created_at);
    if (now - last < 60 * 1000) {
      return res.status(429).json({ error: "Please wait before requesting another code" });
    }
  }

  const code = otpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expires = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  await db.run(
    `INSERT INTO otp_codes (contact_type, contact_value, code_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    contact.type,
    contact.value,
    codeHash,
    expires,
    now.toISOString()
  );

  const delivery = await sendOtpMessage(contact, code);
  if (!delivery.ok) {
    return res.status(500).json({ error: delivery.error || "OTP delivery failed" });
  }

  return res.json({ ok: true });
});

app.post("/api/auth/verify-otp", otpLimiter, async (req, res) => {
  const contact = getContactInfo(req.body.contact);
  const code = String(req.body.code || "").trim();
  if (!contact || code.length < 4) {
    return res.status(400).json({ error: "Invalid code" });
  }

  const now = new Date().toISOString();
  const otp = await db.get(
    `SELECT * FROM otp_codes
     WHERE contact_type = ? AND contact_value = ?
       AND consumed_at IS NULL AND expires_at > ?
     ORDER BY created_at DESC
     LIMIT 1`,
    contact.type,
    contact.value,
    now
  );

  if (!otp) return res.status(400).json({ error: "Code expired" });

  if (otp.attempts >= 5) {
    return res.status(429).json({ error: "Too many attempts" });
  }

  const ok = await bcrypt.compare(code, otp.code_hash);
  if (!ok) {
    await db.run("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?", otp.id);
    return res.status(400).json({ error: "Invalid code" });
  }

  await db.run("UPDATE otp_codes SET consumed_at = ? WHERE id = ?", now, otp.id);

  let user = null;
  if (contact.type === "email") {
    user = await db.get("SELECT * FROM users WHERE email = ?", contact.value);
  } else {
    user = await db.get("SELECT * FROM users WHERE phone = ?", contact.value);
  }

  if (!user) {
    const createdAt = new Date().toISOString();
    const name = contact.type === "email" ? contact.value.split("@")[0] : "User";
    const email = contact.type === "email" ? contact.value : `phone_${contact.value}@phone.local`;
    const phone = contact.type === "phone" ? contact.value : null;
    const result = await db.run(
      "INSERT INTO users (name, email, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      name,
      email,
      phone,
      await bcrypt.hash(otpCode(), 8),
      createdAt
    );
    const userId = result.lastID;
    await db.run(
      `INSERT INTO targets (user_id, calories, protein, carbs, fat, fiber, sodium, daily_cost, planned_calories)
       VALUES (?, 2000, 140, 220, 70, 28, 2300, 0, NULL)`,
      userId
    );
    await db.run(
      `INSERT INTO profiles
        (user_id, sex, birth_year, height_cm, activity_level, goal, goal_weight_kg, pace_kg_per_week, weight_unit, height_unit, currency, profile_image)
       VALUES (?, 'unspecified', NULL, NULL, 'moderate', 'maintain', NULL, 0.5, 'kg', 'cm', 'USD', NULL)`,
      userId
    );
    await db.run(
      `INSERT INTO profile_visibility
        (user_id, show_name, show_email, show_phone, show_height, show_weight, show_bmi, show_measurements, show_goal, show_activity, show_avatar)
       VALUES (?, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
      userId
    );
    user = { id: userId, name, email, phone };
  }

  if (contact.type === "email") {
    await db.run("UPDATE users SET email_verified = 1 WHERE id = ?", user.id);
  } else {
    await db.run("UPDATE users SET phone_verified = 1 WHERE id = ?", user.id);
  }

  const token = createToken(user);
  res.cookie("token", token, createCookieOptions());
  return res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
});

app.get("/api/profile", requireAuth, async (req, res) => {
  const targets = await db.get(
    "SELECT calories, protein, carbs, fat, fiber, sodium, daily_cost, planned_calories FROM targets WHERE user_id = ?",
    req.user.id
  );

  const profile = await db.get(
    `SELECT sex, birth_year, height_cm, activity_level, goal, goal_weight_kg, pace_kg_per_week, weight_unit, height_unit, currency, profile_image
     FROM profiles WHERE user_id = ?`,
    req.user.id
  );

  let visibility = await db.get(
    `SELECT show_name, show_email, show_phone, show_height, show_weight, show_bmi, show_measurements, show_goal, show_activity, show_avatar
     FROM profile_visibility WHERE user_id = ?`,
    req.user.id
  );

  if (!visibility) {
    await db.run(
      `INSERT INTO profile_visibility
        (user_id, show_name, show_email, show_phone, show_height, show_weight, show_bmi, show_measurements, show_goal, show_activity, show_avatar)
       VALUES (?, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
      req.user.id
    );
    visibility = await db.get(
      `SELECT show_name, show_email, show_phone, show_height, show_weight, show_bmi, show_measurements, show_goal, show_activity, show_avatar
       FROM profile_visibility WHERE user_id = ?`,
      req.user.id
    );
  }

  const user = await db.get(
    "SELECT id, name, email, phone FROM users WHERE id = ?",
    req.user.id
  );

  return res.json({
    user,
    targets,
    profile,
    visibility
  });
});

app.put("/api/profile", requireAuth, async (req, res) => {
  const sex = ["male", "female", "unspecified"].includes(req.body.sex)
    ? req.body.sex
    : "unspecified";
  const birthYear = req.body.birthYear ? clampNumber(req.body.birthYear, 1900, 2026) : null;
  const heightUnit = ["cm", "in", "m"].includes(req.body.heightUnit)
    ? req.body.heightUnit
    : "cm";
  const heightCm = req.body.height
    ? clampNumber(toCm(req.body.height, heightUnit) || 0, 90, 250)
    : null;
  const activityLevel = ["sedentary", "light", "moderate", "very", "athlete"].includes(req.body.activityLevel)
    ? req.body.activityLevel
    : "moderate";
  const goal = ["lose", "maintain", "gain"].includes(req.body.goal)
    ? req.body.goal
    : "maintain";
  const weightUnit = ["kg", "lb"].includes(req.body.weightUnit)
    ? req.body.weightUnit
    : "kg";
  const goalWeight = req.body.goalWeight
    ? clampNumber(toKg(req.body.goalWeight, weightUnit) || 0, 30, 300)
    : null;
  const pace = clampNumber(req.body.paceKgPerWeek || 0.5, 0.1, 1.5);
  const currency = String(req.body.currency || "USD").slice(0, 4).toUpperCase();

  const name = req.body.name ? String(req.body.name).trim() : null;
  const phone = req.body.phone ? normalizePhone(req.body.phone) : null;

  await db.run(
    `UPDATE profiles
     SET sex = ?, birth_year = ?, height_cm = ?, activity_level = ?, goal = ?,
         goal_weight_kg = ?, pace_kg_per_week = ?, weight_unit = ?, height_unit = ?, currency = ?
     WHERE user_id = ?`,
    sex,
    birthYear,
    heightCm,
    activityLevel,
    goal,
    goalWeight,
    pace,
    weightUnit,
    heightUnit,
    currency,
    req.user.id
  );

  if (name || phone) {
    if (phone) {
      const existing = await db.get(
        "SELECT id FROM users WHERE phone = ? AND id != ?",
        phone,
        req.user.id
      );
      if (existing) {
        return res.status(409).json({ error: "Phone already registered" });
      }
    }
    await db.run(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?`,
      name || null,
      phone || null,
      req.user.id
    );
  }

  const profile = await db.get(
    `SELECT sex, birth_year, height_cm, activity_level, goal, goal_weight_kg, pace_kg_per_week, weight_unit, height_unit, currency, profile_image
     FROM profiles WHERE user_id = ?`,
    req.user.id
  );

  return res.json(profile);
});

app.put("/api/profile/privacy", requireAuth, async (req, res) => {
  const toBool = (val, fallback) => (typeof val === "boolean" ? val : fallback);
  const existing = await db.get(
    `SELECT * FROM profile_visibility WHERE user_id = ?`,
    req.user.id
  );

  if (!existing) {
    await db.run(
      `INSERT INTO profile_visibility
        (user_id, show_name, show_email, show_phone, show_height, show_weight, show_bmi, show_measurements, show_goal, show_activity, show_avatar)
       VALUES (?, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
      req.user.id
    );
  }

  const updated = {
    show_name: toBool(req.body.show_name, existing?.show_name === 1),
    show_email: toBool(req.body.show_email, existing?.show_email === 1),
    show_phone: toBool(req.body.show_phone, existing?.show_phone === 1),
    show_height: toBool(req.body.show_height, existing?.show_height === 1),
    show_weight: toBool(req.body.show_weight, existing?.show_weight === 1),
    show_bmi: toBool(req.body.show_bmi, existing?.show_bmi === 1),
    show_measurements: toBool(req.body.show_measurements, existing?.show_measurements === 1),
    show_goal: toBool(req.body.show_goal, existing?.show_goal === 1),
    show_activity: toBool(req.body.show_activity, existing?.show_activity === 1),
    show_avatar: toBool(req.body.show_avatar, existing?.show_avatar === 1)
  };

  await db.run(
    `UPDATE profile_visibility
     SET show_name = ?, show_email = ?, show_phone = ?, show_height = ?, show_weight = ?, show_bmi = ?, show_measurements = ?, show_goal = ?, show_activity = ?, show_avatar = ?
     WHERE user_id = ?`,
    updated.show_name ? 1 : 0,
    updated.show_email ? 1 : 0,
    updated.show_phone ? 1 : 0,
    updated.show_height ? 1 : 0,
    updated.show_weight ? 1 : 0,
    updated.show_bmi ? 1 : 0,
    updated.show_measurements ? 1 : 0,
    updated.show_goal ? 1 : 0,
    updated.show_activity ? 1 : 0,
    updated.show_avatar ? 1 : 0,
    req.user.id
  );

  return res.json(updated);
});

app.put("/api/profile/avatar", requireAuth, async (req, res) => {
  const image = String(req.body.image || "").trim();
  if (!image.startsWith("data:image/")) {
    return res.status(400).json({ error: "Invalid image" });
  }
  if (image.length > 2_000_000) {
    return res.status(400).json({ error: "Image too large" });
  }
  await db.run(
    `UPDATE profiles SET profile_image = ? WHERE user_id = ?`,
    image,
    req.user.id
  );
  return res.json({ ok: true, profile_image: image });
});

app.post("/api/ai/validate", requireAuth, async (req, res) => {
  const existing = await getAiSettings(req.user.id);
  const providerInput = String(req.body.provider || existing.provider || "openai").trim();
  const provider = ["openai", "gemini", "anthropic", "xai"].includes(providerInput)
    ? providerInput
    : "openai";
  const apiKey = String(req.body.apiKey || "").trim();
  const modelInput = String(req.body.model || "").trim();
  const model = normalizeModelForProvider(provider, modelInput || existing.model || "");
  const settings = {
    provider,
    apiKey: apiKey || existing.apiKey || null,
    model: model || defaultModelForProvider(provider),
    enabled: true
  };

  const result = await validateAiKey(settings);
  if (!result.ok) {
    return res.status(400).json({
      error: result.reason || "Validation failed",
      detail: result.detail || null
    });
  }
  return res.json({ ok: true });
});

app.get("/api/ai/settings", requireAuth, async (req, res) => {
  const settings = await getAiSettings(req.user.id);
  const provider = settings.provider || "openai";
  const enabled = aiEnabled(settings);
  const model = settings.model || "";
  const envKey = envKeyForProvider(provider);
  const hasKey = Boolean(settings.apiKey || envKey);
  const source = settings.apiKey ? "user" : envKey ? "server" : "none";
  return res.json({ enabled, model, hasKey, source, provider });
});

app.put("/api/ai/settings", requireAuth, async (req, res) => {
  const existing = await db.get(
    "SELECT provider, api_key, model, enabled FROM ai_settings WHERE user_id = ?",
    req.user.id
  );
  const providerInput = String(req.body.provider || existing?.provider || "openai").trim();
  const provider = ["openai", "gemini", "anthropic", "xai"].includes(providerInput)
    ? providerInput
    : "openai";
  const apiKey = String(req.body.apiKey || "").trim();
  const clearKey = Boolean(req.body.clearKey);
  const model = sanitizeModel(req.body.model);
  const enabled =
    typeof req.body.enabled === "boolean"
      ? req.body.enabled
      : existing
      ? existing.enabled === 1
      : true;

  let finalKey = existing?.api_key || null;
  if (clearKey) finalKey = null;
  if (apiKey) finalKey = apiKey;

  let finalModel = normalizeModelForProvider(provider, model || existing?.model || "");
  if (!modelMatchesProvider(provider, finalModel)) {
    finalModel = defaultModelForProvider(provider);
  }
  if (!finalModel) {
    finalModel = defaultModelForProvider(provider);
  }
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO ai_settings (user_id, provider, api_key, model, enabled, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET provider = excluded.provider, api_key = excluded.api_key, model = excluded.model, enabled = excluded.enabled, updated_at = excluded.updated_at`,
    req.user.id,
    provider,
    finalKey,
    finalModel,
    enabled ? 1 : 0,
    now
  );

  return res.json({
    ok: true,
    enabled,
    model: finalModel || "",
    hasKey: Boolean(finalKey || envKeyForProvider(provider)),
    provider
  });
});

app.put("/api/targets", requireAuth, async (req, res) => {
  const existing = await db.get(
    "SELECT calories, protein, carbs, fat, fiber, sodium, daily_cost, planned_calories FROM targets WHERE user_id = ?",
    req.user.id
  );
  if (!existing) return res.status(404).json({ error: "Targets not found" });

  const has = (value) => value !== undefined;

  const calories = has(req.body.calories)
    ? clampNumber(req.body.calories, 1200, 6000)
    : existing.calories;
  const protein = has(req.body.protein)
    ? clampNumber(req.body.protein, 20, 500)
    : existing.protein;
  const carbs = has(req.body.carbs)
    ? clampNumber(req.body.carbs, 20, 700)
    : existing.carbs;
  const fat = has(req.body.fat)
    ? clampNumber(req.body.fat, 10, 300)
    : existing.fat;
  const fiber = has(req.body.fiber)
    ? clampNumber(req.body.fiber, 5, 100)
    : existing.fiber;
  const sodium = has(req.body.sodium)
    ? clampNumber(req.body.sodium, 500, 5000)
    : existing.sodium;
  const dailyCost = has(req.body.dailyCost)
    ? clampNumber(req.body.dailyCost || 0, 0, 500)
    : existing.daily_cost;

  let plannedCalories = existing.planned_calories;
  if (has(req.body.plannedCalories)) {
    const raw = String(req.body.plannedCalories || "").trim();
    if (!raw) {
      plannedCalories = null;
    } else {
      plannedCalories = clampNumber(raw, 800, 8000);
    }
  }

  await db.run(
    `UPDATE targets
     SET calories = ?, protein = ?, carbs = ?, fat = ?, fiber = ?, sodium = ?, daily_cost = ?, planned_calories = ?
     WHERE user_id = ?`,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sodium,
    dailyCost,
    plannedCalories,
    req.user.id
  );

  return res.json({
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sodium,
    daily_cost: dailyCost,
    planned_calories: plannedCalories
  });
});

app.get("/api/foods", requireAuth, async (req, res) => {
  const query = String(req.query.query || "").trim();
  const limit = clampNumber(req.query.limit || 12, 1, 50);

  let rows;
  if (query) {
    rows = await db.all(
      `SELECT f.*, CASE WHEN fav.food_id IS NULL THEN 0 ELSE 1 END AS is_favorite
       FROM foods f
       LEFT JOIN favorites fav ON fav.food_id = f.id AND fav.user_id = ?
       WHERE (f.user_id IS NULL OR f.user_id = ?)
         AND LOWER(f.name) LIKE LOWER(?)
       ORDER BY is_favorite DESC, f.name ASC
       LIMIT ?`,
      req.user.id,
      req.user.id,
      `%${query}%`,
      limit
    );
  } else {
    rows = await db.all(
      `SELECT f.*, CASE WHEN fav.food_id IS NULL THEN 0 ELSE 1 END AS is_favorite
       FROM foods f
       LEFT JOIN favorites fav ON fav.food_id = f.id AND fav.user_id = ?
       WHERE (f.user_id IS NULL OR f.user_id = ?)
       ORDER BY is_favorite DESC, f.name ASC
       LIMIT ?`,
      req.user.id,
      req.user.id,
      limit
    );
  }

  return res.json(rows);
});

app.post("/api/foods", requireAuth, async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Food name required" });

  const calories = clampNumber(req.body.calories, 0, 2000);
  const protein = clampNumber(req.body.protein, 0, 200);
  const carbs = clampNumber(req.body.carbs, 0, 300);
  const fat = clampNumber(req.body.fat, 0, 200);
  const fiber = clampNumber(req.body.fiber, 0, 100);
  const sodium = clampNumber(req.body.sodium, 0, 5000);
  const costPer100g = clampNumber(req.body.cost_per_100g || 0, 0, 500);
  const currency = String(req.body.currency || "USD").slice(0, 4).toUpperCase();
  const now = new Date().toISOString();

  try {
    const result = await db.run(
      `INSERT INTO foods
        (name, calories, protein, carbs, fat, fiber, sodium, cost_per_100g, currency, is_custom, source, confidence, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'custom', 1, ?, ?)`,
      name,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium,
      costPer100g,
      currency,
      req.user.id,
      now
    );

    return res.status(201).json({
      id: result.lastID,
      name,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium,
      cost_per_100g: costPer100g,
      currency,
      is_custom: 1,
      source: "custom",
      confidence: 1,
      user_id: req.user.id
    });
  } catch (err) {
    return res.status(409).json({ error: "Food already exists" });
  }
});

app.get("/api/entries", requireAuth, async (req, res) => {
  const date = String(req.query.date || "").trim();
  if (!date) return res.status(400).json({ error: "Date required" });

  const rows = await db.all(
    `SELECT e.*, f.name as food_source_name, f.is_custom, f.source as food_source, f.confidence as food_confidence
     FROM entries e
     LEFT JOIN foods f ON f.id = e.food_id
     WHERE e.user_id = ? AND e.eaten_date = ?
     ORDER BY e.created_at DESC`,
    req.user.id,
    date
  );

  return res.json(rows);
});

app.post("/api/entries", requireAuth, async (req, res) => {
  const grams = clampNumber(req.body.grams, 1, 5000);
  const eatenDate = String(req.body.eatenDate || "").trim();
  const meal = String(req.body.meal || "snack").trim().toLowerCase();
  const aiSettings = await getAiSettings(req.user.id);

  if (!eatenDate) return res.status(400).json({ error: "Date required" });

  let food = null;
  let aiEstimate = null;
  if (req.body.foodId) {
    food = await db.get(
      `SELECT * FROM foods WHERE id = ? AND (user_id IS NULL OR user_id = ?)`
      ,
      req.body.foodId,
      req.user.id
    );
  }

  if (!food) {
    const name = String(req.body.foodName || "").trim();
    if (!name) return res.status(400).json({ error: "Food name required" });

    food = await db.get(
      `SELECT * FROM foods
       WHERE (user_id IS NULL OR user_id = ?)
         AND LOWER(name) = LOWER(?)
       LIMIT 1`,
      req.user.id,
      name
    );

    if (!food) {
      if (aiEnabled(aiSettings)) {
        const estimate = await estimateFoodMacros(name, aiSettings);
        if (estimate.ok) {
          aiEstimate = estimate;
          const now = new Date().toISOString();
          try {
            const result = await db.run(
              `INSERT INTO foods
                (name, calories, protein, carbs, fat, fiber, sodium, is_custom, source, confidence, user_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'ai', ?, ?, ?)`,
              name,
              estimate.calories,
              estimate.protein,
              estimate.carbs,
              estimate.fat,
              estimate.fiber,
              estimate.sodium,
              estimate.confidence,
              req.user.id,
              now
            );
            food = {
              id: result.lastID,
              name,
              calories: estimate.calories,
              protein: estimate.protein,
              carbs: estimate.carbs,
              fat: estimate.fat,
              fiber: estimate.fiber,
              sodium: estimate.sodium,
              is_custom: 1,
              source: "ai",
              confidence: estimate.confidence
            };
          } catch (err) {
            food = await db.get(
              `SELECT * FROM foods
               WHERE (user_id IS NULL OR user_id = ?)
                 AND LOWER(name) = LOWER(?)
               LIMIT 1`,
              req.user.id,
              name
            );
          }
        }
      }
    }

    if (!food) {
      const suggestions = await db.all(
        `SELECT id, name FROM foods
         WHERE (user_id IS NULL OR user_id = ?)
           AND LOWER(name) LIKE LOWER(?)
         ORDER BY name ASC
         LIMIT 6`,
        req.user.id,
        `%${name}%`
      );
      return res.status(404).json({
        error: "Food not found",
        suggestions
      });
    }
  }

  const factor = grams / 100;
  const calories = Number((food.calories * factor).toFixed(1));
  const protein = Number((food.protein * factor).toFixed(1));
  const carbs = Number((food.carbs * factor).toFixed(1));
  const fat = Number((food.fat * factor).toFixed(1));
  const fiber = Number((food.fiber * factor).toFixed(1));
  const sodium = Number((food.sodium * factor).toFixed(0));
  const cost = Number(((food.cost_per_100g || 0) * factor).toFixed(2));
  const now = new Date().toISOString();

  const entryNotes = notes || (aiEstimate && aiEstimate.notes ? aiEstimate.notes : null);

  const result = await db.run(
    `INSERT INTO entries
     (user_id, food_id, food_name, grams, calories, protein, carbs, fat, fiber, sodium, cost, eaten_date, meal, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    req.user.id,
    food.id,
    food.name,
    grams,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sodium,
    cost,
    eatenDate,
    meal || "snack",
    entryNotes,
    now
  );

  return res.status(201).json({
    id: result.lastID,
    food_id: food.id,
    food_name: food.name,
    food_source: food.source || (food.is_custom ? "custom" : "seed"),
    food_confidence: food.confidence ?? 1,
    grams,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sodium,
    cost,
    eaten_date: eatenDate,
    meal: meal || "snack",
    notes: entryNotes
  });
});

app.delete("/api/entries/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.run("DELETE FROM entries WHERE id = ? AND user_id = ?", id, req.user.id);
  return res.json({ ok: true });
});

app.get("/api/summary", requireAuth, async (req, res) => {
  const date = String(req.query.date || "").trim();
  if (!date) return res.status(400).json({ error: "Date required" });

  const totals = await db.get(
    `SELECT
      COALESCE(SUM(calories), 0) AS calories,
      COALESCE(SUM(protein), 0) AS protein,
      COALESCE(SUM(carbs), 0) AS carbs,
      COALESCE(SUM(fat), 0) AS fat,
      COALESCE(SUM(fiber), 0) AS fiber,
      COALESCE(SUM(sodium), 0) AS sodium,
      COALESCE(SUM(cost), 0) AS cost
     FROM entries
     WHERE user_id = ? AND eaten_date = ?`,
    req.user.id,
    date
  );

  const targets = await db.get(
    "SELECT calories, protein, carbs, fat, fiber, sodium, daily_cost, planned_calories FROM targets WHERE user_id = ?",
    req.user.id
  );

  return res.json({ totals, targets });
});

app.get("/api/summary-range", requireAuth, async (req, res) => {
  const days = clampNumber(req.query.days || 7, 3, 30);
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");
  const startDate = `${yyyy}-${mm}-${dd}`;

  const rows = await db.all(
    `SELECT eaten_date,
            SUM(calories) AS calories,
            SUM(protein) AS protein,
            SUM(carbs) AS carbs,
            SUM(fat) AS fat,
            SUM(cost) AS cost
     FROM entries
     WHERE user_id = ? AND eaten_date >= ?
     GROUP BY eaten_date
     ORDER BY eaten_date ASC`,
    req.user.id,
    startDate
  );

  return res.json({ startDate, days, rows });
});

app.get("/api/favorites", requireAuth, async (req, res) => {
  const rows = await db.all(
    `SELECT f.*
     FROM favorites fav
     JOIN foods f ON f.id = fav.food_id
     WHERE fav.user_id = ?
     ORDER BY f.name ASC`,
    req.user.id
  );
  return res.json(rows);
});

app.post("/api/favorites", requireAuth, async (req, res) => {
  const foodId = Number(req.body.foodId);
  if (!foodId) return res.status(400).json({ error: "Food id required" });

  const now = new Date().toISOString();
  await db.run(
    "INSERT OR IGNORE INTO favorites (user_id, food_id, created_at) VALUES (?, ?, ?)",
    req.user.id,
    foodId,
    now
  );
  return res.json({ ok: true });
});

app.delete("/api/favorites/:id", requireAuth, async (req, res) => {
  const foodId = Number(req.params.id);
  await db.run(
    "DELETE FROM favorites WHERE user_id = ? AND food_id = ?",
    req.user.id,
    foodId
  );
  return res.json({ ok: true });
});

app.get("/api/recent", requireAuth, async (req, res) => {
  const limit = clampNumber(req.query.limit || 6, 1, 20);
  const rows = await db.all(
    `SELECT food_id, food_name,
            MAX(created_at) AS last_used
     FROM entries
     WHERE user_id = ?
     GROUP BY food_id, food_name
     ORDER BY last_used DESC
     LIMIT ?`,
    req.user.id,
    limit
  );
  return res.json(rows);
});

app.get("/api/weights", requireAuth, async (req, res) => {
  const days = clampNumber(req.query.days || 90, 7, 365);
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
    start.getDate()
  ).padStart(2, "0")}`;

  const rows = await db.all(
    `SELECT id, entry_date, weight_kg, notes
     FROM weight_entries
     WHERE user_id = ? AND entry_date >= ?
     ORDER BY entry_date ASC`,
    req.user.id,
    startDate
  );

  return res.json({ startDate, days, rows });
});

app.post("/api/weights", requireAuth, async (req, res) => {
  const entryDate = String(req.body.entryDate || "").trim();
  if (!entryDate) return res.status(400).json({ error: "Date required" });
  const unit = req.body.unit === "lb" ? "lb" : "kg";
  const weightKg = toKg(req.body.weight, unit);
  if (!weightKg) return res.status(400).json({ error: "Weight required" });
  const notes = String(req.body.notes || "").trim();
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO weight_entries (user_id, weight_kg, entry_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, entry_date)
     DO UPDATE SET weight_kg = excluded.weight_kg, notes = excluded.notes, created_at = excluded.created_at`,
    req.user.id,
    weightKg,
    entryDate,
    notes || null,
    now
  );

  return res.json({ entry_date: entryDate, weight_kg: weightKg, notes: notes || null });
});

app.post("/api/weights/bulk", requireAuth, async (req, res) => {
  const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
  if (!entries.length) return res.status(400).json({ error: "No entries provided" });
  const now = new Date().toISOString();
  const stmt = await db.prepare(
    `INSERT INTO weight_entries (user_id, weight_kg, entry_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, entry_date)
     DO UPDATE SET weight_kg = excluded.weight_kg, notes = excluded.notes, created_at = excluded.created_at`
  );
  try {
    for (const entry of entries) {
      const entryDate = String(entry.entryDate || "").trim();
      if (!entryDate) continue;
      const weightKg = toKg(entry.weight, entry.unit || "kg");
      if (!weightKg) continue;
      await stmt.run(req.user.id, weightKg, entryDate, entry.notes || null, now);
    }
  } finally {
    await stmt.finalize();
  }
  return res.json({ ok: true, count: entries.length });
});

app.delete("/api/weights/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.run("DELETE FROM weight_entries WHERE id = ? AND user_id = ?", id, req.user.id);
  return res.json({ ok: true });
});

app.get("/api/measurements", requireAuth, async (req, res) => {
  const days = clampNumber(req.query.days || 180, 30, 365);
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
    start.getDate()
  ).padStart(2, "0")}`;

  const rows = await db.all(
    `SELECT id, entry_date, waist_cm, chest_cm, hip_cm, thigh_cm, arm_cm, neck_cm, notes
     FROM body_measurements
     WHERE user_id = ? AND entry_date >= ?
     ORDER BY entry_date ASC`,
    req.user.id,
    startDate
  );

  return res.json({ startDate, days, rows });
});

app.post("/api/measurements", requireAuth, async (req, res) => {
  const entryDate = String(req.body.entryDate || "").trim();
  if (!entryDate) return res.status(400).json({ error: "Date required" });
  const unit = ["cm", "in", "m"].includes(req.body.unit) ? req.body.unit : "cm";
  const waist = req.body.waist ? toCm(req.body.waist, unit) : null;
  const chest = req.body.chest ? toCm(req.body.chest, unit) : null;
  const hip = req.body.hip ? toCm(req.body.hip, unit) : null;
  const thigh = req.body.thigh ? toCm(req.body.thigh, unit) : null;
  const arm = req.body.arm ? toCm(req.body.arm, unit) : null;
  const neck = req.body.neck ? toCm(req.body.neck, unit) : null;
  const notes = String(req.body.notes || "").trim();
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO body_measurements
     (user_id, entry_date, waist_cm, chest_cm, hip_cm, thigh_cm, arm_cm, neck_cm, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, entry_date)
     DO UPDATE SET waist_cm = excluded.waist_cm, chest_cm = excluded.chest_cm, hip_cm = excluded.hip_cm,
                   thigh_cm = excluded.thigh_cm, arm_cm = excluded.arm_cm, neck_cm = excluded.neck_cm,
                   notes = excluded.notes, created_at = excluded.created_at`,
    req.user.id,
    entryDate,
    waist,
    chest,
    hip,
    thigh,
    arm,
    neck,
    notes || null,
    now
  );

  return res.json({ entry_date: entryDate, waist_cm: waist, chest_cm: chest, hip_cm: hip, thigh_cm: thigh, arm_cm: arm, neck_cm: neck, notes: notes || null });
});

app.delete("/api/measurements/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.run("DELETE FROM body_measurements WHERE id = ? AND user_id = ?", id, req.user.id);
  return res.json({ ok: true });
});

app.get("/api/activity", requireAuth, async (req, res) => {
  const days = clampNumber(req.query.days || 90, 7, 365);
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
    start.getDate()
  ).padStart(2, "0")}`;

  const rows = await db.all(
    `SELECT id, entry_date, steps, sleep_hours, resting_hr, active_calories, notes
     FROM activity_entries
     WHERE user_id = ? AND entry_date >= ?
     ORDER BY entry_date ASC`,
    req.user.id,
    startDate
  );

  return res.json({ startDate, days, rows });
});

app.post("/api/activity", requireAuth, async (req, res) => {
  const entryDate = String(req.body.entryDate || "").trim();
  if (!entryDate) return res.status(400).json({ error: "Date required" });
  const steps = req.body.steps ? clampNumber(req.body.steps, 0, 100000) : null;
  const sleepHours = req.body.sleepHours ? clampNumber(req.body.sleepHours, 0, 24) : null;
  const restingHr = req.body.restingHr ? clampNumber(req.body.restingHr, 30, 200) : null;
  const activeCalories = req.body.activeCalories ? clampNumber(req.body.activeCalories, 0, 5000) : null;
  const notes = String(req.body.notes || "").trim();
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO activity_entries
     (user_id, entry_date, steps, sleep_hours, resting_hr, active_calories, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, entry_date)
     DO UPDATE SET steps = excluded.steps, sleep_hours = excluded.sleep_hours,
                   resting_hr = excluded.resting_hr, active_calories = excluded.active_calories,
                   notes = excluded.notes, created_at = excluded.created_at`,
    req.user.id,
    entryDate,
    steps,
    sleepHours,
    restingHr,
    activeCalories,
    notes || null,
    now
  );

  return res.json({ entry_date: entryDate, steps, sleep_hours: sleepHours, resting_hr: restingHr, active_calories: activeCalories });
});

app.post("/api/activity/bulk", requireAuth, async (req, res) => {
  const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
  if (!entries.length) return res.status(400).json({ error: "No entries provided" });
  const now = new Date().toISOString();

  const stmt = await db.prepare(
    `INSERT INTO activity_entries
     (user_id, entry_date, steps, sleep_hours, resting_hr, active_calories, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, entry_date)
     DO UPDATE SET steps = excluded.steps, sleep_hours = excluded.sleep_hours,
                   resting_hr = excluded.resting_hr, active_calories = excluded.active_calories,
                   notes = excluded.notes, created_at = excluded.created_at`
  );
  try {
    for (const entry of entries) {
      const entryDate = String(entry.entryDate || "").trim();
      if (!entryDate) continue;
      const steps = entry.steps ? clampNumber(entry.steps, 0, 100000) : null;
      const sleepHours = entry.sleepHours ? clampNumber(entry.sleepHours, 0, 24) : null;
      const restingHr = entry.restingHr ? clampNumber(entry.restingHr, 30, 200) : null;
      const activeCalories = entry.activeCalories ? clampNumber(entry.activeCalories, 0, 5000) : null;
      await stmt.run(
        req.user.id,
        entryDate,
        steps,
        sleepHours,
        restingHr,
        activeCalories,
        entry.notes || null,
        now
      );
    }
  } finally {
    await stmt.finalize();
  }

  return res.json({ ok: true, count: entries.length });
});

app.delete("/api/activity/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.run("DELETE FROM activity_entries WHERE id = ? AND user_id = ?", id, req.user.id);
  return res.json({ ok: true });
});

async function resolveFoodForUser(userId, item, aiSettings) {
  if (item.foodId) {
    return db.get(
      `SELECT * FROM foods WHERE id = ? AND (user_id IS NULL OR user_id = ?)`,
      item.foodId,
      userId
    );
  }
  const name = String(item.foodName || "").trim();
  if (!name) return null;
  let food = await db.get(
    `SELECT * FROM foods
     WHERE (user_id IS NULL OR user_id = ?)
       AND LOWER(name) = LOWER(?)
     LIMIT 1`,
    userId,
    name
  );
  if (food) return food;
  const settings = aiSettings || (await getAiSettings(userId));
  if (aiEnabled(settings)) {
    const estimate = await estimateFoodMacros(name, settings);
    if (estimate.ok) {
      const now = new Date().toISOString();
      const result = await db.run(
        `INSERT INTO foods
          (name, calories, protein, carbs, fat, fiber, sodium, is_custom, source, confidence, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'ai', ?, ?, ?)`,
        name,
        estimate.calories,
        estimate.protein,
        estimate.carbs,
        estimate.fat,
        estimate.fiber,
        estimate.sodium,
        estimate.confidence,
        userId,
        now
      );
      food = {
        id: result.lastID,
        name,
        calories: estimate.calories,
        protein: estimate.protein,
        carbs: estimate.carbs,
        fat: estimate.fat,
        fiber: estimate.fiber,
        sodium: estimate.sodium,
        cost_per_100g: 0,
        currency: "USD",
        is_custom: 1,
        source: "ai",
        confidence: estimate.confidence
      };
      return food;
    }
  }
  return null;
}

app.get("/api/plates", requireAuth, async (req, res) => {
  const plates = await db.all(
    `SELECT id, name, notes, created_at
     FROM plates
     WHERE user_id = ?
     ORDER BY name ASC`,
    req.user.id
  );

  const result = [];
  for (const plate of plates) {
    const items = await db.all(
      `SELECT id, food_id, food_name, grams
       FROM plate_items
       WHERE plate_id = ?
       ORDER BY id ASC`,
      plate.id
    );
    result.push({ ...plate, items });
  }

  return res.json(result);
});

app.post("/api/plates", requireAuth, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const notes = String(req.body.notes || "").trim();
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!name) return res.status(400).json({ error: "Plate name required" });
  if (!items.length) return res.status(400).json({ error: "Add at least one item" });

  const now = new Date().toISOString();
  const aiSettings = await getAiSettings(req.user.id);
  let plateId;
  try {
    const result = await db.run(
      "INSERT INTO plates (user_id, name, notes, created_at) VALUES (?, ?, ?, ?)",
      req.user.id,
      name,
      notes || null,
      now
    );
    plateId = result.lastID;
  } catch (err) {
    return res.status(409).json({ error: "Plate name already exists" });
  }

  const stmt = await db.prepare(
    "INSERT INTO plate_items (plate_id, food_id, food_name, grams, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  try {
    for (const item of items) {
      const grams = clampNumber(item.grams, 1, 2000);
      const food = await resolveFoodForUser(req.user.id, item, aiSettings);
      if (!food) continue;
      await stmt.run(plateId, food.id, food.name, grams, now);
    }
  } finally {
    await stmt.finalize();
  }

  return res.status(201).json({ id: plateId, name, notes: notes || null });
});

app.delete("/api/plates/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.run("DELETE FROM plates WHERE id = ? AND user_id = ?", id, req.user.id);
  return res.json({ ok: true });
});

app.post("/api/plates/:id/log", requireAuth, async (req, res) => {
  const plateId = Number(req.params.id);
  const eatenDate = String(req.body.eatenDate || "").trim();
  const meal = String(req.body.meal || "snack").trim().toLowerCase();
  if (!eatenDate) return res.status(400).json({ error: "Date required" });

  const items = await db.all(
    `SELECT pi.food_id, pi.food_name, pi.grams, f.calories, f.protein, f.carbs, f.fat, f.fiber, f.sodium, f.cost_per_100g
     FROM plate_items pi
     LEFT JOIN foods f ON f.id = pi.food_id
     WHERE pi.plate_id = ?`,
    plateId
  );

  if (!items.length) return res.status(404).json({ error: "Plate not found" });
  const now = new Date().toISOString();
  const created = [];
  const stmt = await db.prepare(
    `INSERT INTO entries
     (user_id, food_id, food_name, grams, calories, protein, carbs, fat, fiber, sodium, cost, eaten_date, meal, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  try {
    for (const item of items) {
      if (!item.calories && item.calories !== 0) continue;
      const factor = item.grams / 100;
      const calories = Number((item.calories * factor).toFixed(1));
      const protein = Number((item.protein * factor).toFixed(1));
      const carbs = Number((item.carbs * factor).toFixed(1));
      const fat = Number((item.fat * factor).toFixed(1));
      const fiber = Number((item.fiber * factor).toFixed(1));
      const sodium = Number((item.sodium * factor).toFixed(0));
      const cost = Number(((item.cost_per_100g || 0) * factor).toFixed(2));
      await stmt.run(
        req.user.id,
        item.food_id,
        item.food_name,
        item.grams,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sodium,
        cost,
        eatenDate,
        meal || "snack",
        `Plate log`,
        now
      );
      created.push({ food_name: item.food_name, grams: item.grams, calories, protein, carbs, fat });
    }
  } finally {
    await stmt.finalize();
  }

  return res.json({ ok: true, created });
});

app.get("/api/rations", requireAuth, async (req, res) => {
  const rows = await db.all(
    `SELECT id, name, quantity, unit, grams_per_unit, cost_per_unit, currency, notes, created_at, updated_at
     FROM rations
     WHERE user_id = ?
     ORDER BY name ASC`,
    req.user.id
  );
  return res.json(rows);
});

app.post("/api/rations", requireAuth, async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Ration name required" });
  const unit = ["g", "kg", "pcs"].includes(req.body.unit) ? req.body.unit : "g";
  const quantity = clampNumber(req.body.quantity || 0, 0, 1000000);
  const gramsPerUnit = req.body.gramsPerUnit
    ? clampNumber(req.body.gramsPerUnit, 1, 5000)
    : null;
  const costPerUnit = clampNumber(req.body.costPerUnit || 0, 0, 1000000);
  const notes = String(req.body.notes || "").trim();

  const profile = await db.get("SELECT currency FROM profiles WHERE user_id = ?", req.user.id);
  const currency = String(req.body.currency || profile?.currency || "USD").slice(0, 4).toUpperCase();
  const now = new Date().toISOString();

  try {
    const result = await db.run(
      `INSERT INTO rations
        (user_id, name, quantity, unit, grams_per_unit, cost_per_unit, currency, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      req.user.id,
      name,
      quantity,
      unit,
      gramsPerUnit,
      costPerUnit,
      currency,
      notes || null,
      now,
      now
    );
    return res.status(201).json({
      id: result.lastID,
      name,
      quantity,
      unit,
      grams_per_unit: gramsPerUnit,
      cost_per_unit: costPerUnit,
      currency,
      notes: notes || null
    });
  } catch (err) {
    return res.status(409).json({ error: "Ration item already exists" });
  }
});

app.put("/api/rations/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const existing = await db.get(
    `SELECT * FROM rations WHERE id = ? AND user_id = ?`,
    id,
    req.user.id
  );
  if (!existing) return res.status(404).json({ error: "Ration not found" });

  const name = req.body.name ? String(req.body.name || "").trim() : existing.name;
  const unit = req.body.unit
    ? ["g", "kg", "pcs"].includes(req.body.unit)
      ? req.body.unit
      : existing.unit
    : existing.unit;
  const quantity = req.body.quantity !== undefined
    ? clampNumber(req.body.quantity || 0, 0, 1000000)
    : existing.quantity;
  const gramsPerUnit = req.body.gramsPerUnit !== undefined
    ? req.body.gramsPerUnit
      ? clampNumber(req.body.gramsPerUnit, 1, 5000)
      : null
    : existing.grams_per_unit;
  const costPerUnit = req.body.costPerUnit !== undefined
    ? clampNumber(req.body.costPerUnit || 0, 0, 1000000)
    : existing.cost_per_unit;
  const currency = req.body.currency
    ? String(req.body.currency).slice(0, 4).toUpperCase()
    : existing.currency;
  const notes = req.body.notes !== undefined
    ? String(req.body.notes || "").trim() || null
    : existing.notes;

  const now = new Date().toISOString();
  await db.run(
    `UPDATE rations
     SET name = ?, quantity = ?, unit = ?, grams_per_unit = ?, cost_per_unit = ?, currency = ?, notes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    name,
    quantity,
    unit,
    gramsPerUnit,
    costPerUnit,
    currency,
    notes,
    now,
    id,
    req.user.id
  );

  return res.json({
    id,
    name,
    quantity,
    unit,
    grams_per_unit: gramsPerUnit,
    cost_per_unit: costPerUnit,
    currency,
    notes
  });
});

app.delete("/api/rations/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.run("DELETE FROM rations WHERE id = ? AND user_id = ?", id, req.user.id);
  return res.json({ ok: true });
});

app.get("/api/rations/estimate", requireAuth, async (req, res) => {
  const days = clampNumber(req.query.days || 7, 1, 30);
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  const startDate = start.toISOString().slice(0, 10);

  const rations = await db.all(
    `SELECT id, name, quantity, unit, grams_per_unit, cost_per_unit, currency
     FROM rations
     WHERE user_id = ?
     ORDER BY name ASC`,
    req.user.id
  );

  const entryRows = await db.all(
    `SELECT LOWER(food_name) AS food_name, SUM(grams) AS grams
     FROM entries
     WHERE user_id = ? AND eaten_date >= ?
     GROUP BY LOWER(food_name)`,
    req.user.id,
    startDate
  );
  const usageMap = new Map(entryRows.map((row) => [row.food_name, row.grams || 0]));

  const items = rations.map((item) => {
    const key = item.name.toLowerCase();
    const totalGrams = usageMap.get(key) || 0;
    const avgDailyGrams = totalGrams / days;

    let avgDailyQty = null;
    if (item.unit === "g") {
      avgDailyQty = avgDailyGrams;
    } else if (item.unit === "kg") {
      avgDailyQty = avgDailyGrams / 1000;
    } else if (item.unit === "pcs") {
      if (item.grams_per_unit) {
        avgDailyQty = avgDailyGrams / item.grams_per_unit;
      }
    }

    const neededQty = avgDailyQty !== null ? avgDailyQty * days : null;
    const shortageQty = neededQty !== null ? Math.max(neededQty - item.quantity, 0) : null;
    const estimatedCost = neededQty !== null ? neededQty * (item.cost_per_unit || 0) : null;
    const shortageCost = shortageQty !== null ? shortageQty * (item.cost_per_unit || 0) : null;

    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      avg_daily_qty: avgDailyQty !== null ? round(avgDailyQty, 2) : null,
      needed_qty: neededQty !== null ? round(neededQty, 2) : null,
      shortage_qty: shortageQty !== null ? round(shortageQty, 2) : null,
      estimated_cost: estimatedCost !== null ? round(estimatedCost, 2) : null,
      shortage_cost: shortageCost !== null ? round(shortageCost, 2) : null,
      currency: item.currency
    };
  });

  const totalShortageCost = items.reduce(
    (sum, item) => sum + (item.shortage_cost || 0),
    0
  );
  const totalNeededCost = items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

  return res.json({
    days,
    startDate,
    items,
    total_shortage_cost: round(totalShortageCost, 2),
    total_needed_cost: round(totalNeededCost, 2)
  });
});

app.get("/api/meal-plan", requireAuth, async (req, res) => {
  const aiSettings = await getAiSettings(req.user.id);
  const plan = await db.get(
    `SELECT id, source, data_json, preferences_json, health_notes, created_at, updated_at
     FROM meal_plans
     WHERE user_id = ?
     ORDER BY updated_at DESC
     LIMIT 1`,
    req.user.id
  );

  if (!plan) {
    return res.json({ plan: null, aiEnabled: aiEnabled(aiSettings) });
  }

  let data = null;
  let preferences = null;
  try {
    data = JSON.parse(plan.data_json);
  } catch {
    data = null;
  }
  try {
    preferences = plan.preferences_json ? JSON.parse(plan.preferences_json) : null;
  } catch {
    preferences = null;
  }

  return res.json({
    plan: {
      id: plan.id,
      source: plan.source,
      data,
      preferences,
      healthNotes: plan.health_notes,
      created_at: plan.created_at,
      updated_at: plan.updated_at
    },
    aiEnabled: aiEnabled(aiSettings)
  });
});

app.post("/api/meal-plan/generate", requireAuth, async (req, res) => {
  const aiSettings = await getAiSettings(req.user.id);

  const healthComplications = String(req.body.healthComplications || "").trim();
  if (!healthComplications) {
    return res.status(400).json({ error: "Please add health complications (or 'none')." });
  }

  const preferences = String(req.body.preferences || "").trim();
  const avoid = String(req.body.avoid || "").trim();
  const useRationOnly = Boolean(req.body.useRationOnly);

  const profile = await db.get(
    `SELECT sex, birth_year, height_cm, activity_level, goal, goal_weight_kg, pace_kg_per_week, currency
     FROM profiles WHERE user_id = ?`,
    req.user.id
  );
  const targets = await db.get(
    "SELECT calories, protein, carbs, fat, fiber, daily_cost FROM targets WHERE user_id = ?",
    req.user.id
  );
  const weightRow = await db.get(
    `SELECT weight_kg FROM weight_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 1`,
    req.user.id
  );

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const startDate = start.toISOString().slice(0, 10);
  const summaryRows = await db.all(
    `SELECT eaten_date,
            SUM(calories) AS calories,
            SUM(protein) AS protein,
            SUM(carbs) AS carbs,
            SUM(fat) AS fat,
            SUM(cost) AS cost
     FROM entries
     WHERE user_id = ? AND eaten_date >= ?
     GROUP BY eaten_date`,
    req.user.id,
    startDate
  );

  const avg = summaryRows.length
    ? summaryRows.reduce(
        (acc, row) => {
          acc.calories += row.calories || 0;
          acc.protein += row.protein || 0;
          acc.carbs += row.carbs || 0;
          acc.fat += row.fat || 0;
          acc.cost += row.cost || 0;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 }
      )
    : null;

  const avgContext = avg
    ? {
        avg_calories: round(avg.calories / summaryRows.length, 0),
        avg_protein: round(avg.protein / summaryRows.length, 0),
        avg_carbs: round(avg.carbs / summaryRows.length, 0),
        avg_fat: round(avg.fat / summaryRows.length, 0),
        avg_cost: round(avg.cost / summaryRows.length, 2)
      }
    : {};

  const foodsRows = await db.all(
    `SELECT name FROM foods
     WHERE user_id IS NULL OR user_id = ?
     ORDER BY is_custom DESC, created_at DESC
     LIMIT 80`,
    req.user.id
  );
  const foods = foodsRows.map((row) => row.name);

  const plateRows = await db.all(
    `SELECT p.id, p.name, GROUP_CONCAT(pi.food_name, ', ') AS items
     FROM plates p
     LEFT JOIN plate_items pi ON pi.plate_id = p.id
     WHERE p.user_id = ?
     GROUP BY p.id
     ORDER BY p.name ASC`,
    req.user.id
  );
  const plates = plateRows.map((row) =>
    row.items ? `${row.name} (${row.items})` : row.name
  );

  let previousPlan = null;
  if (req.body.previousPlanId) {
    const prev = await db.get(
      `SELECT data_json FROM meal_plans WHERE id = ? AND user_id = ?`,
      Number(req.body.previousPlanId),
      req.user.id
    );
    if (prev?.data_json) previousPlan = prev.data_json.slice(0, 2000);
  }

  const currentWeight = weightRow?.weight_kg || null;
  const age = profile?.birth_year ? new Date().getFullYear() - profile.birth_year : null;
  const bmi = currentWeight && profile?.height_cm
    ? round(currentWeight / ((profile.height_cm / 100) ** 2), 1)
    : null;

  const planInput = {
    healthComplications,
    preferences,
    avoid,
    useRationOnly,
    profile: {
      sex: profile?.sex,
      age,
      height_cm: profile?.height_cm,
      activity_level: profile?.activity_level,
      goal: profile?.goal,
      goal_weight_kg: profile?.goal_weight_kg,
      pace_kg_per_week: profile?.pace_kg_per_week,
      currency: profile?.currency,
      current_weight_kg: currentWeight,
      bmi
    },
    targets,
    foods: useRationOnly ? plates : foods,
    plates,
    context: { ...avgContext, previous_plan: previousPlan }
  };

  let planData = null;
  let planSource = "fallback";
  let aiFailure = null;

  if (aiEnabled(aiSettings)) {
    const mealResult = await generateMealPlan(planInput, aiSettings);
    if (mealResult.ok) {
      planData = mealResult.plan;
      planSource = "ai";
    } else {
      console.error("Meal plan generation failed", mealResult);
      aiFailure = mealResult.reason || "api_error";
    }
  } else {
    aiFailure = "AI disabled";
  }

  if (!planData) {
    planData = buildFallbackMealPlan({ ...planInput, aiFailure });
    planSource = "fallback";
  }

  const now = new Date().toISOString();
  const payload = {
    preferences,
    avoid,
    useRationOnly: Boolean(useRationOnly)
  };

  const result = await db.run(
    `INSERT INTO meal_plans
      (user_id, source, data_json, preferences_json, health_notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    req.user.id,
    planSource,
    JSON.stringify(planData),
    JSON.stringify(payload),
    healthComplications,
    now,
    now
  );

  return res.json({
    plan: {
      id: result.lastID,
      source: planSource,
      data: planData,
      preferences: payload,
      healthNotes: healthComplications,
      created_at: now,
      updated_at: now
    }
  });
});

app.put("/api/meal-plan/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid plan id" });
  const data = req.body.data;
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "Plan data required" });
  }
  const now = new Date().toISOString();
  await db.run(
    `UPDATE meal_plans SET data_json = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    JSON.stringify(data),
    now,
    id,
    req.user.id
  );
  return res.json({ ok: true, updated_at: now });
});

app.get("/api/recommendation", requireAuth, async (req, res) => {
  let profile = await db.get(
    `SELECT sex, birth_year, height_cm, activity_level, goal, goal_weight_kg, pace_kg_per_week
     FROM profiles WHERE user_id = ?`,
    req.user.id
  );
  if (!profile) {
    await db.run(
      `INSERT INTO profiles
        (user_id, sex, birth_year, height_cm, activity_level, goal, goal_weight_kg, pace_kg_per_week, weight_unit, height_unit, currency, profile_image)
       VALUES (?, 'unspecified', NULL, NULL, 'moderate', 'maintain', NULL, 0.5, 'kg', 'cm', 'USD', NULL)`,
      req.user.id
    );
    profile = {
      sex: "unspecified",
      birth_year: null,
      height_cm: null,
      activity_level: "moderate",
      goal: "maintain",
      goal_weight_kg: null,
      pace_kg_per_week: 0.5,
      profile_image: null
    };
  }
  const targets = await db.get(
    "SELECT calories, planned_calories FROM targets WHERE user_id = ?",
    req.user.id
  );
  const weightRow = await db.get(
    `SELECT weight_kg, entry_date FROM weight_entries
     WHERE user_id = ?
     ORDER BY entry_date DESC
     LIMIT 1`,
    req.user.id
  );

  const missing = [];
  const currentWeight = weightRow ? weightRow.weight_kg : null;
  if (!currentWeight) missing.push("weight");
  if (!profile.height_cm) missing.push("height");
  if (!profile.birth_year) missing.push("birth_year");

  const age = profile.birth_year ? new Date().getFullYear() - profile.birth_year : null;
  const bmr = calcBmr({ sex: profile.sex, weightKg: currentWeight, heightCm: profile.height_cm, age });
  const tdee = bmr ? bmr * activityMultiplier(profile.activity_level) : null;
  const bmi = currentWeight && profile.height_cm
    ? currentWeight / ((profile.height_cm / 100) ** 2)
    : null;

  let targetCalories = tdee;
  const pace = profile.pace_kg_per_week || 0.5;
  if (tdee) {
    if (profile.goal === "lose") {
      targetCalories = tdee - (pace * 7700) / 7;
    } else if (profile.goal === "gain") {
      targetCalories = tdee + (pace * 7700) / 7;
    }
  }

  const suggestedMacros = macroSuggestion(
    currentWeight,
    targetCalories ? Math.round(targetCalories) : null,
    profile.goal
  );

  const plannedCalories = targets?.planned_calories && targets.planned_calories > 0
    ? targets.planned_calories
    : null;

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const startDate = start.toISOString().slice(0, 10);
  const recentRows = await db.all(
    `SELECT eaten_date, SUM(calories) AS calories
     FROM entries
     WHERE user_id = ? AND eaten_date >= ?
     GROUP BY eaten_date`,
    req.user.id,
    startDate
  );
  const recentAvgCalories = recentRows.length
    ? recentRows.reduce((sum, row) => sum + (row.calories || 0), 0) / recentRows.length
    : null;

  let projectionCalories = null;
  let projectionMethod = null;
  if (plannedCalories) {
    projectionCalories = plannedCalories;
    projectionMethod = "planned";
  } else if (recentAvgCalories && targetCalories) {
    const diffRatio = Math.abs(recentAvgCalories - targetCalories) / targetCalories;
    if (diffRatio <= 0.1) {
      projectionCalories = round(targetCalories, 0);
      projectionMethod = "suggested (pace)";
    } else {
      projectionCalories = round(recentAvgCalories, 0);
      projectionMethod = "recent avg";
    }
  } else if (recentAvgCalories) {
    projectionCalories = round(recentAvgCalories, 0);
    projectionMethod = "recent avg";
  } else if (targetCalories) {
    projectionCalories = round(targetCalories, 0);
    projectionMethod = "suggested (pace)";
  } else if (targets?.calories) {
    projectionCalories = targets.calories;
    projectionMethod = "target";
  }

  let weeklyChangeKg = null;
  if (tdee && projectionCalories !== null) {
    weeklyChangeKg = round(((tdee - projectionCalories) * 7) / 7700, 2);
  } else if (profile.goal !== "maintain" && pace) {
    weeklyChangeKg = profile.goal === "gain" ? -pace : pace;
    if (!projectionMethod) projectionMethod = "goal pace";
  }

  let weeksToGoal = null;
  let projectedDate = null;
  if (weeklyChangeKg && profile.goal_weight_kg && currentWeight) {
    const delta = profile.goal_weight_kg - currentWeight;
    const changePerWeek = -weeklyChangeKg;
    if (changePerWeek !== 0) {
      const rawWeeks = delta / changePerWeek;
      if (rawWeeks > 0 && Number.isFinite(rawWeeks)) {
        weeksToGoal = rawWeeks;
        const target = new Date();
        target.setDate(target.getDate() + Math.round(weeksToGoal * 7));
        projectedDate = target.toISOString().slice(0, 10);
      }
    }
  }

  let impractical = null;
  if (projectionCalories && tdee) {
    if (profile.goal === "lose" && projectionCalories >= tdee) {
      impractical = "Planned intake is above maintenance for fat loss.";
    } else if (profile.goal === "gain" && projectionCalories <= tdee) {
      impractical = "Planned intake is below maintenance for weight gain.";
    }
  }
  if (!impractical && bmr && projectionCalories) {
    const minPractical = Math.max(1200, bmr * 0.8);
    if (projectionCalories < minPractical) {
      impractical = "Planned intake is quite low; consider a smaller deficit.";
    }
  }
  if (!impractical && weeklyChangeKg && Math.abs(weeklyChangeKg) > 1.25) {
    impractical = "Projection is very aggressive; consider a gentler pace.";
  }

  return res.json({
    missing,
    currentWeight,
    bmi: bmi ? round(bmi, 1) : null,
    bmr: bmr ? round(bmr, 0) : null,
    tdee: tdee ? round(tdee, 0) : null,
    suggestedCalories: targetCalories ? round(targetCalories, 0) : null,
    suggestedMacros,
    plannedCalories,
    projectionCalories,
    projectionMethod,
    impractical,
    weeklyChangeKg,
    projectedDate,
    weeksToGoal: weeksToGoal ? round(weeksToGoal, 1) : null
  });
});

async function getPublicProfile(userId) {
  const user = await db.get("SELECT id, name, email, phone FROM users WHERE id = ?", userId);
  if (!user) return null;
  const profile = await db.get(
    `SELECT sex, birth_year, height_cm, activity_level, goal, goal_weight_kg, profile_image
     FROM profiles WHERE user_id = ?`,
    userId
  );
  const visibility = await db.get(
    `SELECT show_name, show_email, show_phone, show_height, show_weight, show_bmi, show_measurements, show_goal, show_activity, show_avatar
     FROM profile_visibility WHERE user_id = ?`,
    userId
  );
  const weight = await db.get(
    `SELECT weight_kg, entry_date FROM weight_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 1`,
    userId
  );
  const measurement = await db.get(
    `SELECT waist_cm, chest_cm, hip_cm, thigh_cm, arm_cm, neck_cm, entry_date
     FROM body_measurements WHERE user_id = ? ORDER BY entry_date DESC LIMIT 1`,
    userId
  );

  const heightCm = profile?.height_cm || null;
  const bmi = heightCm && weight?.weight_kg
    ? round(weight.weight_kg / ((heightCm / 100) ** 2), 1)
    : null;

  return {
    id: user.id,
    avatar: visibility?.show_avatar ? profile?.profile_image : null,
    name: visibility?.show_name ? user.name : null,
    email: visibility?.show_email ? user.email : null,
    phone: visibility?.show_phone ? user.phone : null,
    height_cm: visibility?.show_height ? heightCm : null,
    current_weight_kg: visibility?.show_weight ? weight?.weight_kg : null,
    bmi: visibility?.show_bmi ? bmi : null,
    activity_level: visibility?.show_activity ? profile?.activity_level : null,
    goal: visibility?.show_goal ? profile?.goal : null,
    goal_weight_kg: visibility?.show_goal ? profile?.goal_weight_kg : null,
    measurements: visibility?.show_measurements ? measurement : null,
    updated_at: weight?.entry_date || measurement?.entry_date || null
  };
}

app.get("/api/profile/qr", requireAuth, async (req, res) => {
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const publicUrl = `${baseUrl.replace(/\/$/, "")}/public/${req.user.id}`;
  const dataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 220 });
  return res.json({ publicUrl, dataUrl });
});

app.get("/api/public-profile/:id", async (req, res) => {
  const userId = Number(req.params.id);
  const profile = await getPublicProfile(userId);
  if (!profile) return res.status(404).json({ error: "Not found" });
  return res.json(profile);
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "app.html"));
});

app.get("/public/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
