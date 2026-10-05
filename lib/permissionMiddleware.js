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

function digits(value) {
  return normalize(value).replace(/\D/g, "");
}

function getOwnerNumber() {
  try {
    const globalSettings = settings.get("global");
    return digits(globalSettings.ownernumber || config.owner || "");
  } catch {
    return digits(config.owner || "");
  }
}

function isOwner(senderNumber) {
  const senderNum = digits(senderNumber);
  const ownerNum = getOwnerNumber();
  return Boolean(senderNum && ownerNum && senderNum === ownerNum);
}

function isSudo(senderNumber, a = access()) {
  const senderNum = digits(senderNumber);
  return Boolean(senderNum && (a.sudo || []).some(x => digits(x) === senderNum));
}

async function permissionMiddleware(sock, msg, senderNumber, isGroup) {
  try {
    const senderNum = digits(senderNumber);
    const globalSettings = settings.get("global");
    const a = access();

    if ((a.ban || []).some(x => digits(x) === senderNum)) return false;

    const owner = isOwner(senderNumber);
    const sudo = isSudo(senderNumber, a);
    const mode = String(globalSettings.mode || "public").toLowerCase();

    if (owner || sudo) return true;
    if (config.maintenance) return false;
    if (mode === "private") return false;
    if (mode === "group" && !isGroup) return false;

    if (isGroup) {
      const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
      const isAdmin = groupMetadata.participants.find(p =>
        digits(p.id) === senderNum
      )?.admin;

      if (isAdmin) return true;
    }

    return mode === "public" || mode === "group";
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

permissionMiddleware.isOwnerOrSudo = function(senderNumber) {
  try {
    const a = access();
    return isOwner(senderNumber) || isSudo(senderNumber, a);
  } catch {
    return false;
  }
};

module.exports = permissionMiddleware;