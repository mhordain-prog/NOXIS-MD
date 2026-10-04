const os = require("os");
const config = require("../../config");

const send = (sock, to, text) => sock.sendMessage(to, { text });

module.exports = [
  {
    name: "runtime",
    aliases: ["uptime"],
    category: "system",
    description: "Temps de fonctionnement",
    async execute(sock, msg, args, ctx) {
      const s = Math.floor(process.uptime());
      return send(sock, ctx.sender, `⏱️ NOXIS-MD\nUptime: ${Math.floor(s/86400)}j ${Math.floor((s%86400)/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`);
    }
  },
  {
    name: "system",
    aliases: ["sysinfo", "serverinfo"],
    category: "system",
    description: "Informations du serveur",
    async execute(sock, msg, args, ctx) {
      const mem = process.memoryUsage();
      return send(sock, ctx.sender,
        "🖥️ SYSTÈME NOXIS-MD\n" +
        `• OS: ${os.platform()} ${os.arch()}\n` +
        `• Node: ${process.version}\n` +
        `• CPU: ${os.cpus().length} cœur(s)\n` +
        `• RAM utilisée: ${Math.round(mem.rss / 1024 / 1024)} MB\n` +
        `• Version: ${config.version}`
      );
    }
  },
  {
    name: "prefix",
    aliases: ["getprefix"],
    category: "system",
    description: "Affiche le préfixe actuel",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender, `⚙️ Préfixe actuel: ${config.prefix}`);
    }
  }
];
