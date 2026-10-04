const startTelegramBot = require("./telegram/bot");
const { startWhatsApp, getSocket } = require("./whatsapp/connection");
const config = require("./config");
const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const { getLatestQR } = require("./whatsapp/connection");

// Ensure required directories exist
const requiredDirs = [
  config.sessionsPath,
  config.dbPath,
  config.logsPath
];

requiredDirs.forEach(dir => {
  fs.ensureDirSync(dir);
});

const app = express();

app.get("/", (req, res) => {
  res.send("<h1>NOXIS-MD</h1><p>WhatsApp bot is running.</p><p><a href=\"/qr\">Open WhatsApp QR</a></p>");
});

app.get("/health", (req, res) => res.json({ ok: true, whatsapp: !!getSocket() }));

app.get("/qr", (req, res) => {
  const { image } = getLatestQR();
  if (!image) return res.status(404).send("<h2>QR non disponible</h2><p>Le bot est déjà connecté ou le QR n’a pas encore été généré. Recharge cette page dans quelques secondes.</p>");
  res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="5"></head><body style="font-family:sans-serif;text-align:center;padding:20px"><h2>📱 Connecter NOXIS-MD</h2><p>WhatsApp → Appareils connectés → Connecter un appareil → scanne ce QR.</p><img src="${image}" width="320" height="320" alt="WhatsApp QR"><p>Le QR se rafraîchit automatiquement.</p></body></html>`);
});

const server = app.listen(config.port, config.host, () => {
  console.log(`🌐 Web server: http://${config.host}:${config.port}`);
});

async function main() {
  console.log("╔════════════════════════════════════╗");
  console.log("║   🤖 SIMON TECH BOT v" + config.version + "       ║");
  console.log("║  WhatsApp Multi-Device Bot         ║");
  console.log("╚════════════════════════════════════╝");
  console.log("");
  console.log("🚀 Starting bot components...");
  console.log("━".repeat(36));

  try {
    // Start WhatsApp Connection
    console.log("📱 Initializing WhatsApp connection...");
    const waSocket = await startWhatsApp();
    console.log("✅ WhatsApp initialized");
    
    // Start Telegram Bot
    console.log("📡 Starting Telegram bot...");
    startTelegramBot();
    console.log("✅ Telegram bot started");

    console.log("━".repeat(36));
    console.log("🟢 BOT IS ONLINE");
    console.log("");
    console.log(`📊 Bot Name: ${config.botName}`);
    console.log(`👑 Owner: ${config.owner}`);
    console.log(`⚙️  Prefix: ${config.prefix}`);
    console.log(`🔧 Mode: ${config.botMode.toUpperCase()}`);
    console.log("");
    console.log("Use .menu to see all available commands");
    console.log("");

  } catch (error) {
    console.error("❌ Error starting bot:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n⛔ Bot shutting down gracefully...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("💥 Unhandled Rejection:", error);
});

main().catch(console.error);

module.exports = main;
