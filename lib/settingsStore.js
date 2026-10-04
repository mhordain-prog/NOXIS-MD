const fs = require("fs-extra");
const path = require("path");
const file = path.join(__dirname, "../data/settings.json");

const defaults = {
  mode: "public",
  botname: "NOXIS-MD",
  ownername: "Hordain Madila",
  ownernumber: "",
  description: "NOXIS-MD WhatsApp Bot",
  stickername: "NOXIS-MD",
  welcome: false,
  goodbye: false,
  welcomeText: "👋 Bienvenue @user dans @group !",
  goodbyeText: "👋 @user a quitté @group.",
  antilink: false,
  antidelete: false,
  antiedit: false,
  autoread: false,
  autotyping: false,
  autoreact: true,
  recording: false,
  online: false,
  statusview: false,
  statuslike: false,
  anticall: false,
  anticallmsg: "❌ Les appels ne sont pas autorisés. Écris-moi ici.",
  adminaction: false,
  reactemojis: "⚡❤️🔥😂👍",
  owneremojis: "👑",
  editpath: "./data/edits.json",
  delpath: "./data/deleted.json"
};

function load() { try { return fs.readJsonSync(file); } catch { return {}; } }
async function save(data) { await fs.ensureFile(file); await fs.writeJson(file, data, { spaces: 2 }); }
function get(scope = "global") { return { ...defaults, ...(load()[scope] || {}) }; }
async function set(scope, key, value) {
  const data = load();
  if (!data[scope]) data[scope] = {};
  data[scope][key] = value;
  await save(data);
}
module.exports = { defaults, load, save, get, set };
