const TelegramBot = require("node-telegram-bot-api");
const config = require("../config");
const { getSocket } = require("../whatsapp/connection");

function startTelegramBot() {
  const bot = new TelegramBot(config.telegramToken, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const welcomeText = `
🤖 Bienvenue sur NOXIS-MD

👋 Salut ${msg.from.first_name} !

Bot WhatsApp Multi-Device.

🆔 Tes informations :
• ID: ${msg.from.id}
• Nom: ${msg.from.first_name}

📖 Commandes:
/start
/help
/ping
/status
/menu
`;

    bot.sendMessage(msg.chat.id, welcomeText, { parse_mode: "Markdown" });
  });

  bot.onText(/\/help/, (msg) => {
    const helpText = `
📖 *NOXIS-MD - Guide des commandes*

🎯 *Commandes :*
/start - Message d'accueil
/help - Aide
/ping - Vérifier le bot
/status - Statut
/info - Informations
/qr - QR WhatsApp

Utilise .menu sur WhatsApp pour voir les commandes.
`;

    bot.sendMessage(msg.chat.id, helpText, { parse_mode: "Markdown" });
  });

  bot.onText(/\/ping/, (msg) => {
    const start = Date.now();
    bot.sendMessage(msg.chat.id, "🏓 Pinging...").then(() => {
      const ping = Date.now() - start;
      bot.sendMessage(msg.chat.id, `🏓 *Pong!*\\nLatency: \`${ping}ms\``, {
        parse_mode: "Markdown"
      });
    });
  });

  bot.onText(/\/status/, (msg) => {
    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const statusText = `
🟢 *NOXIS-MD : ONLINE*

📊 *Informations :*
• Version: ${config.version}
• Mode: ${config.botMode.toUpperCase()}
• Uptime: ${hours}h ${minutes}m ${seconds}s
• Nom: ${config.botName}
• Préfixe: ${config.prefix}
• Commandes: 800+
`;

    bot.sendMessage(msg.chat.id, statusText, { parse_mode: "Markdown" });
  });

  bot.onText(/\/info/, (msg) => {
    const infoText = `
ℹ️ *Informations NOXIS-MD*

🤖 *Bot :*
• Nom: ${config.botName}
• Version: ${config.version}
• Type: WhatsApp Multi-Device
• Framework: Baileys

👑 *Propriétaire :*
• Nom: Hordain Madila
• WhatsApp: ${config.owner}

🔧 *Fonctionnalités :*
• Multi-Device
• Gestion de groupe
• Commandes
• Intégration Telegram

`;

    bot.sendMessage(msg.chat.id, infoText, { parse_mode: "Markdown" });
  });

  bot.onText(/\/menu/, (msg) => {
    const menuText = `
╭──────────────────────────────╮
│          🤖 NOXIS-MD         │
│       WhatsApp Multi-Device  │
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

📊 STATUS: ONLINE 🟢
👑 OWNER: Hordain Madila

Utilise .menu sur WhatsApp pour le menu complet.
`;

    bot.sendMessage(msg.chat.id, menuText);
  });

  bot.onText(/\/qr/, async (msg) => {
    if (msg.from.id.toString() !== config.owner) {
      return bot.sendMessage(msg.chat.id, "❌ Seul le propriétaire peut utiliser cette commande.");
    }

    bot.sendMessage(
      msg.chat.id,
      "📸 *QR WhatsApp*\\n\\nOuvre WhatsApp et scanne le QR de NOXIS-MD.",
      { parse_mode: "Markdown" }
    );
  });

  console.log("✅ NOXIS-MD Telegram Bot Started");
}

module.exports = startTelegramBot;
