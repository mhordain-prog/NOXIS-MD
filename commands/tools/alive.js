const config = require("../../config");

module.exports = {
  name: "alive",
  aliases: ["online", "botstatus"],
  category: "tools",
  description: "Afficher le statut du bot",
  async execute(sock, msg, args, c) {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    await sock.sendMessage(c.sender, {
      text: `╭━━〔 ⚡ NOXIS-MD 〕━━╮
│ 🟢 Statut : EN LIGNE
│ 🤖 Bot : ${config.botName || "NOXIS-MD"}
│ 📦 Version : ${config.version || "N/A"}
│ ⏱️ Uptime : ${h}h ${m}m ${s}s
╰━━━━━━━━━━━━━━━━━━╯`
    });
  }
};