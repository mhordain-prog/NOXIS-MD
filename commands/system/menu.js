const config = require("../../config");
const commandLoader = require("../../lib/commandLoader");

module.exports = {
  name: "menu",
  aliases: ["help", "cmd", "commands"],
  category: "system",
  description: "Affiche les commandes disponibles",

  async execute(sock, msg, args, context) {
    const { sender } = context;
    const commands = commandLoader.getCommands();
    const groups = {};

    for (const command of commands) {
      const category = String(command.category || "tools").toUpperCase();
      if (!groups[category]) groups[category] = [];
      groups[category].push(command.name);
    }

    const order = [
      "OWNER","SYSTEM","PROFILE","GROUP","SECURITY","AI","DOWNLOADER",
      "MEDIA","FUN","GAMES","ECONOMY","BANK","ANIME","SEARCH","TOOLS",
      "INTERNET","DESIGN","EDUCATION","CLOUD","DEVELOPER"
    ];

    const labels = {
      OWNER:"👑 OWNER", SYSTEM:"⚙️ SYSTEM", PROFILE:"👤 PROFILE",
      GROUP:"👥 GROUP", SECURITY:"🔐 SECURITY", AI:"🧠 AI",
      DOWNLOADER:"📥 DOWNLOADER", MEDIA:"🖼️ MEDIA", FUN:"🎮 FUN",
      GAMES:"🎮 GAMES", ECONOMY:"💰 ECONOMY", BANK:"🏦 BANK",
      ANIME:"🎭 ANIME", SEARCH:"🔍 SEARCH", TOOLS:"🛠️ TOOLS",
      INTERNET:"🌐 INTERNET", DESIGN:"🎨 DESIGN", EDUCATION:"📚 EDUCATION",
      CLOUD:"☁️ CLOUD", DEVELOPER:"🚀 DEVELOPER"
    };

    let body = "";
    for (const category of order) {
      const list = groups[category];
      if (list?.length) {
        body += `\n├⊷ ${labels[category] || category}\n`;
        body += list.sort().map(n => `│  • ${config.prefix}${n}`).join("\n") + "\n";
      }
    }

    for (const [category, list] of Object.entries(groups)) {
      if (!order.includes(category) && list.length) {
        body += `\n├⊷ ${category}\n`;
        body += list.sort().map(n => `│  • ${config.prefix}${n}`).join("\n") + "\n";
      }
    }

    const unique = new Set(commands.map(c => c.name));
    const menuText =
      `╭──────────────────────────────╮\n` +
      `│       🤖 NOXIS-MD ${config.version}       │\n` +
      `│         ⚡ ONLINE ⚡          │\n` +
      `╰──────────────────────────────╯\n` +
      body +
      `\n├⊷ 📊 COMMANDES ACTIVES: ${unique.size}\n` +
      `├⊷ 🤖 MULTI DEVICE\n` +
      `├⊷ 🟢 STATUS: ONLINE\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(sender, { text: menuText });
  }
};
