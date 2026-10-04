const os = require("os");

module.exports = {
  name: "health",
  aliases: ["check"],
  category: "system",
  description: "Vérifier la santé du processus",

  async execute(sock, msg) {
    const m = process.memoryUsage();
    const uptime = Math.floor(process.uptime());
    const load = os.loadavg ? os.loadavg()[0].toFixed(2) : "N/A";
    await sock.sendMessage(msg.key.remoteJid, {
      text:
        "🩺 NOXIS-MD HEALTH\n\n" +
        "🟢 Processus : actif\n" +
        `⏱️ Uptime : ${uptime}s\n` +
        `🧠 RAM : ${Math.round(m.rss / 1024 / 1024)} MB\n` +
        `⚙️ CPU load : ${load}`
    });
  }
};