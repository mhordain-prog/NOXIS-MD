const crypto = require("crypto");
const { users } = require("./database");

function normalizeId(id) {
  return String(id || "").split(":")[0].replace(/@.*/, "").replace(/\D/g, "");
}

function makeCode() {
  return "NOX" + crypto.randomBytes(4).toString("hex").toUpperCase();
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
    code: makeCode(),
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
  return { code: user.code, count: user.referrals.length, referrals: [...user.referrals] };
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

module.exports = { normalizeId, ensureUser, findByCode, getStats, applyReferral };
