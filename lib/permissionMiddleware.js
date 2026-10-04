const config = require("../config");
const fs = require("fs-extra");
const path = require("path");
const settings = require("./settingsStore");

const accessFile = path.join(__dirname, "../data/access.json");

function access() {
  try { return fs.readJsonSync(accessFile); } catch { return { sudo: [], ban: [] }; }
}

function normalize(value) {
  return String(value || "").split(":")[0];
}

async function permissionMiddleware(sock, msg, senderNumber, isGroup) {
  try {
    const sender = normalize(senderNumber);
    const senderNum = sender.split("@")[0].replace(/\D/g, "");
    const globalSettings = settings.get("global");
    const configuredOwner = String(globalSettings.ownernumber || "").replace(/\D/g, "");
    const configOwner = String(config.owner || "").replace(/\D/g, "");
    const ownerNum = configuredOwner || configOwner;
    const jid = senderNumber;
    const a = access();

    if ((a.ban || []).includes(jid) || (a.ban || []).includes(normalize(jid))) return false;

    const isOwner = Boolean(senderNum && ownerNum && senderNum === ownerNum);
    const isSudo = (a.sudo || []).some(x => normalize(x) === normalize(jid));
    const mode = String(globalSettings.mode || "public").toLowerCase();

    if (isOwner || isSudo) return true;
    if (config.maintenance) return false;

    if (mode === "private") return false;
    if (mode === "group" && !isGroup) return false;

    if (isGroup) {
      const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
      const isAdmin = groupMetadata.participants.find(p =>
        String(p.id).split("@")[0].replace(/\D/g, "") === senderNum
      )?.admin;

      if (isAdmin) return true;
    }

    return mode === "public" || mode === "group";
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

module.exports = permissionMiddleware;
