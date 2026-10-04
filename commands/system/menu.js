const config = require("../../config");
const commandLoader = require("../../lib/commandLoader");

module.exports = {
  name: "menu",
  aliases: ["help", "cmd", "commands"],
  category: "system",
  description: "Show all available commands",

  async execute(sock, msg, args, context) {
    const { sender } = context;
    const commands = commandLoader.getCommands();
    const names = commands.map(c => c.name).filter(Boolean);
    const menuText = `
╭──────────────────────────────╮
│       🤖 NOXIS-MD ${config.version}       │
│         ⚡ ONLINE ⚡          │
╰──────────────────────────────╯

├⊷ 👑 OWNER
├⊷ ⚙️ SYSTEM
├⊷ 👤 PROFILE
├⊷ 👥 GROUP
├⊷ 🔐 SECURITY
├⊷ 🧠 AI
├⊷ 📥 DOWNLOADER
├⊷ 🖼️ MEDIA
├⊷ 🎮 GAMES
├⊷ 💰 ECONOMY
├⊷ 🏦 BANK
├⊷ 🎭 ANIME
├⊷ 🔍 SEARCH
├⊷ 🛠️ TOOLS
├⊷ 🌐 INTERNET
├⊷ 🎨 DESIGN
├⊷ 📚 EDUCATION
├⊷ ☁️ CLOUD
├⊷ 🚀 DEVELOPER

├⊷ 📊 COMMANDES ACTIVES: ${names.length}
├⊷ 🤖 BOT TYPE: MULTI DEVICE
├⊷ ⚡ VERSION: ${config.version}
├⊷ 👑 OWNER: HORDAIN MADILA
├⊷ 🚀 STATUS: ONLINE 🟢
╰━━━━━━━━━━━━━━━━━━━━━━━╯

📝 COMMANDES PRINCIPALES:
${names.map(n => config.prefix + n).join(" • ")}

🖤 NOXIS-MD — Simple. Rapide. Puissant.
`;
    await sock.sendMessage(sender, { text: menuText });
  }
};
