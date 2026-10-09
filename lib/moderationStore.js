const fs = require("fs-extra");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
const dataFile = path.join(dataDir, "moderation.json");

function normalizeNumber(value) {
  return String(value || "").split(":")[0].replace(/\D/g, "");
}

function load() {
  fs.ensureDirSync(dataDir);
  if (!fs.existsSync(dataFile)) {
    fs.writeJsonSync(dataFile, { reports: [], blocked: [] }, { spaces: 2 });
  }
  const value = fs.readJsonSync(dataFile);
  return {
    reports: Array.isArray(value.reports) ? value.reports : [],
    blocked: Array.isArray(value.blocked) ? value.blocked : []
  };
}

function save(value) {
  fs.ensureDirSync(dataDir);
  fs.writeJsonSync(dataFile, value, { spaces: 2 });
}

function isBlocked(number) {
  const target = normalizeNumber(number);
  if (!target) return false;
  return load().blocked.some(item => normalizeNumber(item.number || item) === target);
}

function block(number, reason, actor) {
  const data = load();
  const target = normalizeNumber(number);
  if (!data.blocked.some(item => normalizeNumber(item.number || item) === target)) {
    data.blocked.push({ number: target, reason, actor, date: new Date().toISOString() });
  }
  save(data);
  return data;
}

function unblock(number) {
  const target = normalizeNumber(number);
  const data = load();
  data.blocked = data.blocked.filter(item => normalizeNumber(item.number || item) !== target);
  save(data);
  return data;
}

function addReport(number, reason, actor, evidence = "") {
  const data = load();
  const report = {
    number: normalizeNumber(number),
    reason,
    evidence: String(evidence || "").slice(0, 1500),
    actor: normalizeNumber(actor) || "owner",
    date: new Date().toISOString()
  };
  data.reports.push(report);
  save(data);
  return { report, count: data.reports.length };
}

function listBlocked() {
  return load().blocked;
}

module.exports = { normalizeNumber, isBlocked, block, unblock, addReport, listBlocked };
