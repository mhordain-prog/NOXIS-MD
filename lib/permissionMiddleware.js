const config = require("../config");
const fs = require("fs-extra");
const path = require("path");
const settings = require("./settingsStore");

const accessFile = path.join(__dirname, "../data/access.json");
let runtimeOwner = "";

function normalize(value) {
  return String(value || "").split(":")[0];
}

function digits(value) {
  return normalize(value).replace(/\D/g, "");
}

function access() {
  try {
    const data = fs.readJsonSync(accessFile);
    return {
      sudo: Array.isArray(data.sudo) ? data.sudo : [],
      ban: Array.isArray(data.ban) ? data.ban : []
    };
  } catch {
    return { sudo: [], ban: [] };
  }
}

function setRuntimeOwner(sock) {
  const id = sock?.user?.id;
  const number = digits(id);
  if (number.length >= 6) runtimeOwner = number;
}

function getOwnerNumber() {
  try {
    const globalSettings = settings.get("global") || {};
    const storedOwner = digits(globalSettings.ownernumber);
    const configOwner = digits(config.owner);

    if (storedOwner.length >= 6) return storedOwner;
    if (configOwner.length >= 6) return configOwner;
  } catch {}

  return runtimeOwner;
}

function isOwner(senderNumber) {
  const sender = digits(senderNumber);
  const owner = getOwnerNumber();
  return Boolean(sender && owner && sender === owner);
}

function isSudo(senderNumber, data = access()) {
  const sender = digits(senderNumber);
  return Boolean(
    sender &&
    data.sudo.some(number => digits(number) === sender)
  );
}

function isOwnerOrSudo(senderNumber) {
  try {
    return isOwner(senderNumber) || isSudo(senderNumber);
  } catch (error) {
    console.error("Owner/SUDO check error:", error);
    return false;
  }
}

async function permissionMiddleware(sock, msg, senderNumber, isGroup) {
  try {
    setRuntimeOwner(sock);

    const sender = digits(senderNumber);
    const data = access();
    const banned = data.ban.some(number => digits(number) === sender);

    if (banned) return false;

    const globalSettings = settings.get("global") || {};
    const mode = String(globalSettings.mode || "public").toLowerCase();

    if (isOwnerOrSudo(senderNumber)) return true;
    if (config.maintenance) return false;
    if (mode === "private") return false;
    if (mode === "group" && !isGroup) return false;

    if (isGroup) {
      const metadata = await sock.groupMetadata(msg.key.remoteJid);
      const participant = metadata.participants.find(
        item => digits(item.id) === sender
      );

      if (participant?.admin) return true;
    }

    return mode === "public" || mode === "group";
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

permissionMiddleware.setRuntimeOwner = setRuntimeOwner;
permissionMiddleware.isOwnerOrSudo = isOwnerOrSudo;
permissionMiddleware.isOwner = isOwner;
permissionMiddleware.getOwnerNumber = getOwnerNumber;

module.exports = permissionMiddleware;
