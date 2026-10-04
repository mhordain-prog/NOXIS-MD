const { users } = require("./database");

function normalizeId(id) {
  return String(id || "").split(":")[0].replace(/@.*/, "").replace(/\D/g, "");
}

function getConfig() {
  const prefix = String(process.env.REFERRAL_CODE_PREFIX || "NOX").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12) || "NOX";
  const start = Math.max(1, Number(process.env.REFERRAL_CODE_START || 1));
  const end = Math.max(start, Number(process.env.REFERRAL_CODE_END || 9999));
  const session = String(process.env.REFERRAL_SESSION_ID || "NOXIS-2026").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "NOXIS-2026";
  return { prefix, start, end, session };
}

function formatCode(number, config = getConfig()) {
  const width = Math.max(4, String(config.end).length);
  return config.prefix + String(number).padStart(width, "0");
}

function makeCode(data) {
  const config = getConfig();
  const used = new Set(Object.values(data || {}).map(value => String(value?.code || "").toUpperCase()));
  for (let number = config.start; number <= config.end; number += 1) {
    const code = formatCode(number, config);
    if (!used.has(code.toUpperCase())) return code;
  }
  throw new Error("La plage de codes de parrainage est épuisée.");
}

function load() {
  return users.getAll();
}

function save(data) {
  return users.setAll(data);
}

function ensureUser(id) {
  const phone = normalizeId(id);
  if (!phone) throw new Error("Identifiant utilisateur invalide.");
  const data = load();
  const key = "ref_" + phone;
  const existing = data[key] || {
    id: phone,
    code: makeCode(data),
    session: getConfig().session,
    referredBy: null,
    referrals: [],
    createdAt: new Date().toISOString()
  };
  if (!Array.isArray(existing.referrals)) existing.referrals = [];
  data[key] = existing;
  save(data);
  return existing;
}

function findByCode(code) {
  const wanted = String(code || "").trim().toUpperCase();
  if (!wanted) return null;
  const data = load();
  for (const value of Object.values(data)) {
    if (value && typeof value === "object" && String(value.code || "").toUpperCase() === wanted) return value;
  }
  return null;
}

function getStats(id) {
  const user = ensureUser(id);
  return {
    code: user.code,
    count: user.referrals.length,
    referrals: [...user.referrals],
    referredBy: user.referredBy || null
  };
}

function getLeaderboard(limit = 10) {
  const data = load();
  return Object.values(data)
    .filter(value => value && typeof value === "object" && value.code && Array.isArray(value.referrals))
    .map(value => ({ id: value.id, code: value.code, count: value.referrals.length }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
    .slice(0, Math.max(1, Math.min(Number(limit) || 10, 25)));
}

function getTotalReferrals() {
  return getLeaderboard(100000).reduce((total, item) => total + item.count, 0);
}

function applyReferral(id, code) {
  const user = ensureUser(id);
  const referrer = findByCode(code);
  if (!referrer) return { ok: false, reason: "invalid" };
  if (referrer.id === user.id) return { ok: false, reason: "self" };
  if (user.referredBy) return { ok: false, reason: "already" };

  const data = load();
  const userKey = "ref_" + user.id;
  const refKey = "ref_" + referrer.id;
  const currentUser = data[userKey];
  const currentReferrer = data[refKey];
  currentUser.referredBy = currentReferrer.code;
  currentUser.referredAt = new Date().toISOString();
  currentReferrer.referrals = Array.isArray(currentReferrer.referrals) ? currentReferrer.referrals : [];
  if (!currentReferrer.referrals.includes(currentUser.id)) currentReferrer.referrals.push(currentUser.id);
  data[userKey] = currentUser;
  data[refKey] = currentReferrer;
  save(data);
  return { ok: true, referrer: currentReferrer };
}

module.exports = {
  normalizeId,
  ensureUser,
  findByCode,
  getStats,
  getLeaderboard,
  getTotalReferrals,
  applyReferral,
  getConfig 
};