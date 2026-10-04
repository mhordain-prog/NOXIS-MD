const fs = require("fs-extra");
const path = require("path");

const file = path.join(__dirname, "../data/warnings.json");

function load() {
  try {
    const data = fs.readJsonSync(file);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

async function save(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}

async function add(groupJid, userJid, reason) {
  const data = load();
  if (!data[groupJid]) data[groupJid] = {};
  if (!data[groupJid][userJid]) data[groupJid][userJid] = [];
  data[groupJid][userJid].push({ reason, at: Date.now() });
  await save(data);
  return data[groupJid][userJid].length;
}

function get(groupJid, userJid) {
  const data = load();
  return data[groupJid]?.[userJid] || [];
}

async function reset(groupJid, userJid) {
  const data = load();
  if (!data[groupJid]?.[userJid]) return 0;
  delete data[groupJid][userJid];
  await save(data);
  return 1;
}

module.exports = { add, get, reset };