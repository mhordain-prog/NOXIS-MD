const fs = require("fs-extra");
const path = require("path");
const settingsStore = require("./settingsStore");

const file = path.join(__dirname, "../data/group-protection.json");
const spam = new Map();

function load() {
  try { return fs.readJsonSync(file); } catch { return {}; }
}
async function save(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}
function get(jid) {
  const data = load();
  return { ...settingsStore.get(jid), antispam: false, ...(data[jid] || {}) };
}
async function set(jid, key, value) {
  const data = load();
  if (!data[jid]) data[jid] = {};
  data[jid][key] = value;
  await save(data);
}

function hasLink(text) {
  return /(?:https?:\/\/|www\.|\b(?:chat\.whatsapp\.com|t\.me|discord\.gg)\/|\b[a-z0-9-]+\.(?:com|net|org|io|me|co)\b)/i.test(text || "");
}

async function isAdmin(sock, jid, user) {
  const meta = await sock.groupMetadata(jid);
  const p = meta.participants.find(x => x.id === user);
  return Boolean(p?.admin);
}

async function protectMessage(sock, msg, text) {
  const jid = msg.key.remoteJid;
  const user = msg.key.participant || msg.key.remoteJid;
  if (!jid?.endsWith("@g.us") || msg.key.fromMe || !text) return false;

  const settings = get(jid);
  if (!settings.antilink && !settings.antispam) return false;

  try {
    if (await isAdmin(sock, jid, user)) return false;
  } catch (e) {
    console.error("Protection metadata error:", e.message);
    return false;
  }

  if (settings.antilink && hasLink(text)) {
    try {
      await sock.sendMessage(jid, { delete: msg.key });
      await sock.sendMessage(jid, { text: "🛡️ Anti-link : lien supprimé." });
    } catch (e) {
      console.error("Anti-link delete error:", e.message);
    }
    return true;
  }

  if (settings.antispam) {
    const key = jid + ":" + user;
    const now = Date.now();
    const list = (spam.get(key) || []).filter(t => now - t < 8000);
    list.push(now);
    spam.set(key, list);
    if (list.length >= 6) {
      try {
        await sock.sendMessage(jid, { delete: msg.key });
        await sock.sendMessage(jid, { text: "🚫 Anti-spam : ralentis tes messages." });
      } catch (e) {
        console.error("Anti-spam delete error:", e.message);
      }
      spam.set(key, []);
      return true;
    }
  }
  return false;
}

module.exports = { load, get, set, protectMessage };