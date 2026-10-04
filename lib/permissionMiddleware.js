const config = require("../config");
const fs = require("fs-extra");
const path = require("path");

const accessFile = path.join(__dirname, "../data/access.json");

function access() {
  try { return fs.readJsonSync(accessFile); } catch { return { sudo: [], ban: [] }; }
}

async function permissionMiddleware(sock, msg, senderNumber, isGroup) {
  try {
    const sender = String(senderNumber || "").split("@")[0];
    const ownerNum = String(config.owner || "").replace(/\D/g, "");
    const senderNum = sender.replace(/\D/g, "");
    const jid = senderNumber;

    if (senderNum === ownerNum) return true;

    const a = access();
    if ((a.ban || []).includes(jid) || (a.ban || []).includes(jid?.split(":")[0])) return false;
    if ((a.sudo || []).includes(jid) || (a.sudo || []).includes(jid?.split(":")[0])) return true;

    if (config.maintenance) return false;

    if (isGroup) {
      const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
      const isAdmin = groupMetadata.participants.find(p =>
        String(p.id).split("@")[0] === senderNum
      )?.admin;

      if (isAdmin) return true;

      const enabledGroups = await getEnabledGroups();
      if (!enabledGroups.includes(msg.key.remoteJid)) return false;
    }

    return true;
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

async function getEnabledGroups() {
  return [];
}

module.exports = permissionMiddleware;