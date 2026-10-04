const fs = require('fs-extra');
const path = require('path');

const file = path.join(__dirname, '../data/activity.json');

function ensure() {
  fs.ensureFileSync(file);
  try {
    const data = fs.readJsonSync(file);
    if (!data || typeof data !== 'object') return {};
    return data;
  } catch {
    return {};
  }
}

async function record(groupJid, userJid) {
  if (!groupJid?.endsWith('@g.us') || !userJid) return;
  const data = ensure();
  if (!data[groupJid]) data[groupJid] = {};
  if (!data[groupJid][userJid]) data[groupJid][userJid] = { messages: 0, lastSeen: 0 };
  data[groupJid][userJid].messages += 1;
  data[groupJid][userJid].lastSeen = Date.now();
  await fs.writeJson(file, data, { spaces: 2 });
}

function getGroup(groupJid) {
  const data = ensure();
  return data[groupJid] || {};
}

module.exports = { record, getGroup };