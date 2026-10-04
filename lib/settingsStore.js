const fs = require("fs-extra");
const path = require("path");
const { Pool } = require("pg");

const file = path.join(__dirname, "../data/settings.json");

const defaults = {
  mode: "public", prefix: ".", botname: "NOXIS-MD", ownername: "Hordain Madila",
  ownernumber: "", description: "NOXIS-MD WhatsApp Bot", stickername: "NOXIS-MD",
  welcome: true, goodbye: true,
  welcomeText: "👋 Bienvenue @user dans @group !",
  goodbyeText: "👋 @user a quitté @group.",
  antilink: false, antidelete: false, antiedit: false, anticall: false,
  anticallmsg: "❌ Les appels ne sont pas autorisés. Écris-moi ici.",
  adminaction: false, autoread: true, autotyping: false, autoreact: true,
  recording: false, online: true, statusview: true, statuslike: true,
  reactemojis: "⚡❤️🔥😂👍", owneremojis: "👑",
  editpath: "./data/edits.json", delpath: "./data/deleted.json"
};

let memory = {};
let pool = null;
let ready = false;

function loadFile() {
  try { return fs.readJsonSync(file); } catch { return {}; }
}

async function saveFile(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}

async function init() {
  if (ready) return;
  memory = loadFile();

  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS noxis_settings (
        scope TEXT NOT NULL,
        key TEXT NOT NULL,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (scope, key)
      )
    `);

    const result = await pool.query("SELECT scope, key, value FROM noxis_settings");
    for (const row of result.rows) {
      if (!memory[row.scope]) memory[row.scope] = {};
      memory[row.scope][row.key] = row.value;
    }
    console.log("💾 NOXIS settings storage: PostgreSQL");
  } else {
    console.log("💾 NOXIS settings storage: local JSON");
  }

  ready = true;
}

function get(scope = "global") {
  return { ...defaults, ...(memory[scope] || {}) };
}

async function set(scope, key, value) {
  if (!ready) await init();
  if (!memory[scope]) memory[scope] = {};
  memory[scope][key] = value;

  if (pool) {
    await pool.query(
      `INSERT INTO noxis_settings (scope, key, value, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (scope, key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [scope, key, JSON.stringify(value)]
    );
    return;
  }

  await saveFile(memory);
}

async function close() {
  if (pool) await pool.end();
  pool = null;
  ready = false;
}

module.exports = { defaults, init, load: () => memory, get, set, save: saveFile, close };
