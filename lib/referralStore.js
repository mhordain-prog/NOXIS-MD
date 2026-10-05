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

const POINTS_PER_REFERRAL = 100;
const WELCOME_POINTS = 25;
const MILESTONES = [
  { count: 1, bonus: 100, label: "Premier filleul" },
  { count: 5, bonus: 500, label: "5 filleuls" },
  { count: 10, bonus: 1000, label: "10 filleuls" },
  { count: 25, bonus: 3000, label: "25 filleuls" },
  { count: 50, bonus: 7500, label: "50 filleuls" }
];

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
    points: 0,
    earnedMilestones: [],
    createdAt: new Date().toISOString()
  };
  if (!Array.isArray(existing.referrals)) existing.referrals = [];
  if (!Number.isFinite(Number(existing.points))) existing.points = 0;
  if (!Array.isArray(existing.earnedMilestones)) existing.earnedMilestones = [];
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
  const next = MILESTONES.find(item => item.count > user.referrals.length);
  return {
    code: user.code,
    count: user.referrals.length,
    referrals: [...user.referrals],
    referredBy: user.referredBy || null,
    points: Number(user.points) || 0,
    nextMilestone: next || null
  };
}

function getLeaderboard(limit = 10) {
  const data = load();
  return Object.values(data)
    .filter(value => value && typeof value === "object" && value.code && Array.isArray(value.referrals))
    .map(value => ({
      id: value.id,
      code: value.code,
      count: value.referrals.length,
      points: Number(value.points) || 0
    }))
    .sort((a, b) => b.count - a.count || b.points - a.points || a.code.localeCompare(b.code))
    .slice(0, Math.max(1, Math.min(Number(limit) || 10, 25)));
}

function getTotalReferrals() {
  return getLeaderboard(100000).reduce((total, item) => total + item.count, 0);
}

function getRewards() {
  return {
    pointsPerReferral: POINTS_PER_REFERRAL,
    welcomePoints: WELCOME_POINTS,
    milestones: MILESTONES.map(item => ({ ...item }))
  };
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
  currentUser.points = (Number(currentUser.points) || 0) + WELCOME_POINTS;

  currentReferrer.referrals = Array.isArray(currentReferrer.referrals) ? currentReferrer.referrals : [];
  if (!currentReferrer.referrals.includes(currentUser.id)) {
    currentReferrer.referrals.push(currentUser.id);
    currentReferrer.points = (Number(currentReferrer.points) || 0) + POINTS_PER_REFERRAL;
  }

  const count = currentReferrer.referrals.length;
  const earned = Array.isArray(currentReferrer.earnedMilestones) ? currentReferrer.earnedMilestones : [];
  const newlyEarned = [];

  for (const milestone of MILESTONES) {
    if (count >= milestone.count && !earned.includes(milestone.count)) {
      currentReferrer.points = (Number(currentReferrer.points) || 0) + milestone.bonus;
      earned.push(milestone.count);
      newlyEarned.push({ ...milestone });
    }
  }

  currentReferrer.earnedMilestones = earned;
  data[userKey] = currentUser;
  data[refKey] = currentReferrer;
  save(data);

  return {
    ok: true,
    referrer: currentReferrer,
    welcomePoints: WELCOME_POINTS,
    referralPoints: POINTS_PER_REFERRAL,
    newlyEarned
  };
}

module.exports = {
  normalizeId,
  ensureUser,
  findByCode,
  getStats,
  getLeaderboard,
  getTotalReferrals,
  getRewards,
  applyReferral,
  getConfig
};
