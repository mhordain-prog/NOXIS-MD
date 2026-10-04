const TelegramBot = require("node-telegram-bot-api");
const config = require("../config");
const { getSocket } = require("../whatsapp/connection");

function startTelegramBot() {
  const bot = new TelegramBot(config.telegramToken, {
    polling: true
  });

  bot.onText(/\/start/, (msg) => {
  const welcomeText = `
🤖 Welcome to SIMON TECH BOT

👋 Hey ${msg.from.first_name}!

This is a public WhatsApp bot.

🆔 Your Info:
• ID: ${msg.from.id}
• Name: ${msg.from.first_name}

📖 Commands:
/start
/help
/ping
/status
/pair <number>
/menu

⚠️ This bot is public — everyone can use available features.
`;

  bot.sendMessage(msg.chat.id, welcomeText, { parse_mode: "Markdown" });
});

    bot.sendMessage(msg.chat.id, welcomeText, { parse_mode: "Markdown" });
  });

  // Help command
  bot.onText(/\/help/, (msg) => {
    const helpText = `
📖 *SIMON TECH BOT - Commands Guide*

🎯 *Basic Commands:*
/start - Welcome message
/help - This help message
/ping - Check if bot is responding
/status - Get bot status
/info - Bot information


⚠️ This bot is public — everyone can use available features.
/pair <number> - Pair WhatsApp number
/qr - Get WhatsApp QR code
/restart - Restart the bot
/broadcast <message> - Send broadcast
/logs - View bot logs
/stats - Bot statistics

🔗 *Integration:*
/link <number> - Link WhatsApp to Telegram
/unlink - Unlink WhatsApp
/session - Check WhatsApp session

Use these commands to control and monitor SIMON TECH BOT.
`;

    bot.sendMessage(msg.chat.id, helpText, { parse_mode: "Markdown" });
  });

  // Ping command
  bot.onText(/\/ping/, (msg) => {
    const start = Date.now();
    bot.sendMessage(msg.chat.id, "🏓 Pinging...").then(() => {
      const ping = Date.now() - start;
      bot.editMessageText(`🏓 *Pong!*\nLatency: \`${ping}ms\``, {
        chat_id: msg.chat.id,
        message_id: msg.message_id + 1,
        parse_mode: "Markdown"
      }).catch(() => {
        bot.sendMessage(msg.chat.id, `🏓 *Pong!*\nLatency: \`${ping}ms\``, {
          parse_mode: "Markdown"
        });
      });
    });
  });

  // Status command
  bot.onText(/\/status/, (msg) => {
    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const statusText = `
🟢 *Bot Status: ONLINE*

📊 *System Info:*
• Status: Active ✅
• Version: ${config.version}
• Mode: ${config.botMode.toUpperCase()}
• Uptime: ${hours}h ${minutes}m ${seconds}s
• Bot Name: ${config.botName}

🧠 *Resources:*
• Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
• Node Version: ${process.version}

📱 *WhatsApp:*
• Connection: Checking...
• Prefix: ${config.prefix}
• Commands: 800+

⚡ *Performance:*
• Response Time: Fast
• Stability: Stable

`;

    bot.sendMessage(msg.chat.id, statusText, { parse_mode: "Markdown" });
  });

  // Info command
  bot.onText(/\/info/, (msg) => {
    const infoText = `
ℹ️ *Bot Information*

🤖 *Bot Details:*
• Name: ${config.botName}
• Version: ${config.version}
• Type: WhatsApp Multi-Device Bot
• Framework: Baileys + Telegram Bot API

👨‍💻 *Developer:*
• Name: SIMON TECH
• WhatsApp: ${config.owner}

🔧 *Features:*
• 800+ Commands
• Multi-Device Support
• Telegram Integration
• Auto Replies
• Command Prefix System
• Owner Controls

🚀 *Platforms:*
• WhatsApp ✅
• Telegram ✅
• Railway ✅
• Replit ✅

📚 *Technologies:*
• Node.js
• Baileys Library
• node-telegram-bot-api
• Express.js

🎯 *Use Cases:*
• Automation
• Fun Features
• Group Management
• Data Processing

`;

    bot.sendMessage(msg.chat.id, infoText, { parse_mode: "Markdown" });
  });

  // Menu command
  bot.onText(/\/menu/, (msg) => {
    const menuText = `
╭──────────────────────────────╮
│    🤖 SIMON TECH BOT 2.0     │
│   WhatsApp Multi-Device      │
╰──────────────────────────────╯

├⊷ 👑 OWNER (50 Commands)
├⊷ ⚙️ SYSTEM (50 Commands)
├⊷ 👤 PROFILE (40 Commands)
├⊷ 👥 GROUP (80 Commands)
├⊷ 🔐 SECURITY (60 Commands)
├⊷ 🧠 AI (100 Commands)
├⊷ 📥 DOWNLOADER (80 Commands)
├⊷ 🖼️ MEDIA (60 Commands)
├⊷ 🎮 GAMES (80 Commands)
├⊷ 💰 ECONOMY (80 Commands)

📊 TOTAL: 800+ Commands
⚡ STATUS: ONLINE 🟢
👑 OWNER: SIMON TECH

Use .menu in WhatsApp to see full menu
`;

    bot.sendMessage(msg.chat.id, menuText);
  });

  // Pair command (Owner only)
  bot.onText(/\/pair (.+)/, async (msg, match) => {
    // Check if owner
    if (msg.from.id.toString() !== config.owner) {
      return bot.sendMessage(msg.chat.id, "❌ Only the bot owner can use this command.");
    }

    const number = match[1];

    bot.sendMessage(
      msg.chat.id,
      `⏳ Generating Pair Code for: +${number}\n\n⚠️ Feature coming soon in next update.`,
      { parse_mode: "Markdown" }
    );
  });

  // QR command (Owner only)
  bot.onText(/\/qr/, async (msg) => {
    if (msg.from.id.toString() !== config.owner) {
      return bot.sendMessage(msg.chat.id, "❌ Only the bot owner can use this command.");
    }

    bot.sendMessage(
      msg.chat.id,
      "📸 *WhatsApp QR Code*\n\nOpen WhatsApp on your phone and scan the QR code that appears in the terminal.",
      { parse_mode: "Markdown" }
    );
  });

  console.log("✅ Telegram Bot Started");
}

module.exports = startTelegramBot;
