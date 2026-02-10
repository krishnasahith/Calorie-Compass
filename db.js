import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "calorie.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database
});

await db.exec("PRAGMA journal_mode = WAL");
await db.exec("PRAGMA foreign_keys = ON");

await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    email_verified INTEGER NOT NULL DEFAULT 0,
    phone_verified INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS targets (
    user_id INTEGER PRIMARY KEY,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fat REAL NOT NULL,
    fiber REAL NOT NULL,
    sodium REAL NOT NULL,
    daily_cost REAL NOT NULL DEFAULT 0,
    planned_calories REAL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    sex TEXT NOT NULL DEFAULT 'unspecified',
    birth_year INTEGER,
    height_cm REAL,
    activity_level TEXT NOT NULL DEFAULT 'moderate',
    goal TEXT NOT NULL DEFAULT 'maintain',
    goal_weight_kg REAL,
    pace_kg_per_week REAL NOT NULL DEFAULT 0.5,
    weight_unit TEXT NOT NULL DEFAULT 'kg',
    height_unit TEXT NOT NULL DEFAULT 'cm',
    currency TEXT NOT NULL DEFAULT 'USD',
    profile_image TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS profile_visibility (
    user_id INTEGER PRIMARY KEY,
    show_name INTEGER NOT NULL DEFAULT 1,
    show_email INTEGER NOT NULL DEFAULT 0,
    show_phone INTEGER NOT NULL DEFAULT 0,
    show_height INTEGER NOT NULL DEFAULT 0,
    show_weight INTEGER NOT NULL DEFAULT 0,
    show_bmi INTEGER NOT NULL DEFAULT 0,
    show_measurements INTEGER NOT NULL DEFAULT 0,
    show_goal INTEGER NOT NULL DEFAULT 0,
    show_activity INTEGER NOT NULL DEFAULT 0,
    show_avatar INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fat REAL NOT NULL,
    fiber REAL NOT NULL,
    sodium REAL NOT NULL,
    cost_per_100g REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_custom INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'seed',
    confidence REAL NOT NULL DEFAULT 1,
    user_id INTEGER,
    created_at TEXT NOT NULL,
    UNIQUE(name, user_id)
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    food_id INTEGER,
    food_name TEXT NOT NULL,
    grams REAL NOT NULL,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fat REAL NOT NULL,
    fiber REAL NOT NULL,
    sodium REAL NOT NULL,
    cost REAL NOT NULL DEFAULT 0,
    eaten_date TEXT NOT NULL,
    meal TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS weight_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    weight_kg REAL NOT NULL,
    entry_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, entry_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS body_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entry_date TEXT NOT NULL,
    waist_cm REAL,
    chest_cm REAL,
    hip_cm REAL,
    thigh_cm REAL,
    arm_cm REAL,
    neck_cm REAL,
    notes TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, entry_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entry_date TEXT NOT NULL,
    steps INTEGER,
    sleep_hours REAL,
    resting_hr REAL,
    active_calories REAL,
    notes TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, entry_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plate_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_id INTEGER NOT NULL,
    food_id INTEGER,
    food_name TEXT NOT NULL,
    grams REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (plate_id) REFERENCES plates(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, food_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_type TEXT NOT NULL,
    contact_value TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    consumed_at TEXT,
    attempts INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS rations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    grams_per_unit REAL,
    cost_per_unit REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_settings (
    user_id INTEGER PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'openai',
    api_key TEXT,
    model TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source TEXT NOT NULL DEFAULT 'ai',
    data_json TEXT NOT NULL,
    preferences_json TEXT,
    health_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

async function addColumnIfMissing(sql) {
  try {
    await db.exec(sql);
  } catch (err) {
    if (!String(err.message || "").includes("duplicate column")) {
      throw err;
    }
  }
}

await addColumnIfMissing("ALTER TABLE foods ADD COLUMN source TEXT NOT NULL DEFAULT 'seed'");
await addColumnIfMissing("ALTER TABLE foods ADD COLUMN confidence REAL NOT NULL DEFAULT 1");
await addColumnIfMissing("ALTER TABLE foods ADD COLUMN cost_per_100g REAL NOT NULL DEFAULT 0");
await addColumnIfMissing("ALTER TABLE foods ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'");
await addColumnIfMissing("ALTER TABLE entries ADD COLUMN cost REAL NOT NULL DEFAULT 0");
await addColumnIfMissing("ALTER TABLE targets ADD COLUMN daily_cost REAL NOT NULL DEFAULT 0");
await addColumnIfMissing("ALTER TABLE targets ADD COLUMN planned_calories REAL");
await addColumnIfMissing("ALTER TABLE users ADD COLUMN phone TEXT");
await addColumnIfMissing("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
await addColumnIfMissing("ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0");
await addColumnIfMissing("ALTER TABLE profiles ADD COLUMN profile_image TEXT");
await addColumnIfMissing("ALTER TABLE profile_visibility ADD COLUMN show_avatar INTEGER NOT NULL DEFAULT 0");
await addColumnIfMissing("ALTER TABLE ai_settings ADD COLUMN provider TEXT NOT NULL DEFAULT 'openai'");
await addColumnIfMissing("ALTER TABLE rations ADD COLUMN grams_per_unit REAL");
await addColumnIfMissing("ALTER TABLE rations ADD COLUMN cost_per_unit REAL NOT NULL DEFAULT 0");
await addColumnIfMissing("ALTER TABLE rations ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'");
await addColumnIfMissing("ALTER TABLE rations ADD COLUMN notes TEXT");

async function seedFoods() {
  const row = await db.get("SELECT COUNT(*) as count FROM foods");
  if (row.count > 0) return;

  const now = new Date().toISOString();
  const foods = [
    ["Chicken breast, cooked", 165, 31, 0, 3.6, 0, 74],
    ["Salmon, cooked", 208, 20, 0, 13, 0, 59],
    ["Egg, whole", 143, 13, 1.1, 9.5, 0, 124],
    ["Greek yogurt, plain", 59, 10, 3.6, 0.4, 0, 36],
    ["Milk, 2%", 50, 3.4, 4.8, 2, 0, 44],
    ["Oats, rolled", 389, 16.9, 66.3, 6.9, 10.6, 2],
    ["Rice, white, cooked", 130, 2.7, 28.2, 0.3, 0.4, 1],
    ["Pasta, cooked", 131, 5, 25, 1.1, 1.4, 1],
    ["Potato, baked", 93, 2.5, 21, 0.1, 2.2, 6],
    ["Sweet potato, baked", 90, 2, 20.7, 0.1, 3.3, 36],
    ["Broccoli, steamed", 35, 2.4, 7.2, 0.4, 3.3, 41],
    ["Spinach, raw", 23, 2.9, 3.6, 0.4, 2.2, 79],
    ["Banana", 89, 1.1, 22.8, 0.3, 2.6, 1],
    ["Apple", 52, 0.3, 14, 0.2, 2.4, 1],
    ["Blueberries", 57, 0.7, 14.5, 0.3, 2.4, 1],
    ["Avocado", 160, 2, 8.5, 14.7, 6.7, 7],
    ["Almonds", 579, 21.2, 21.6, 49.9, 12.5, 1],
    ["Peanut butter", 588, 25, 20, 50, 6, 17],
    ["Olive oil", 884, 0, 0, 100, 0, 2],
    ["Tofu, firm", 144, 15.7, 3.9, 8.7, 2.3, 12],
    ["Lentils, cooked", 116, 9, 20, 0.4, 7.9, 2],
    ["Black beans, cooked", 132, 8.9, 23.7, 0.5, 8.7, 1],
    ["Ground beef 90%", 217, 26, 0, 12, 0, 72],
    ["Turkey breast, cooked", 135, 29, 0, 1, 0, 45],
    ["Bread, whole wheat", 247, 13, 41, 4.2, 7, 467],
    ["Cheddar cheese", 403, 25, 1.3, 33, 0, 621],
    ["Cottage cheese, 2%", 82, 11, 3.4, 2.3, 0, 364],
    ["Quinoa, cooked", 120, 4.4, 21.3, 1.9, 2.8, 7],
    ["Mixed salad greens", 20, 2, 3, 0.2, 2, 30]
  ];

  const stmt = await db.prepare(
    `INSERT INTO foods
      (name, calories, protein, carbs, fat, fiber, sodium, is_custom, source, confidence, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'seed', 1, NULL, ?)`
  );

  try {
    for (const [name, calories, protein, carbs, fat, fiber, sodium] of foods) {
      await stmt.run(name, calories, protein, carbs, fat, fiber, sodium, now);
    }
  } finally {
    await stmt.finalize();
  }
}

await seedFoods();

export default db;
