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
    const totalCommands = commands.length;

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

├⊷ 📊 COMMANDS CHARGÉES: ${totalCommands}
├⊷ 🤖 BOT TYPE: MULTI DEVICE
├⊷ ⚡ VERSION: ${config.version}
├⊷ 👑 OWNER: HORDAIN MADILA
├⊷ 🚀 STATUS: ONLINE 🟢
╰━━━━━━━━━━━━━━━━━━━━━━━╯

📝 Préfixes disponibles:
.owner - Commandes propriétaire
.system - Commandes système
.profile - Profil
.group - Gestion du groupe
.ai - Intelligence artificielle
.game - Jeux
.download - Téléchargements

🖤 NOXIS-MD — Simple. Rapide. Puissant.
`;

    await sock.sendMessage(sender, { text: menuText });
  }
};
