const fs = require("fs-extra");
const path = require("path");

const file = path.join(__dirname, "../data/group-protection.json");

function load() {
  try { return fs.readJsonSync(file); } catch { return {}; }
}
async function save(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}
function get(jid) {
  const data = load();
  return data[jid] || { antilink: false, antispam: false };
}
async function set(jid, key, value) {
  const data = load();
  if (!data[jid]) data[jid] = {};
  data[jid][key] = value;
  await save(data);
}
module.exports = { load, get, set };