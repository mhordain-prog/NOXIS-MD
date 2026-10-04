const config = require("../../config");

const send = (sock, to, text) => sock.sendMessage(to, { text });

module.exports = [
  {
    name: "runtime",
    aliases: ["uptime"],
    category: "system",
    description: "Affiche le temps de fonctionnement du bot",
    async execute(sock, msg, args, ctx) {
      const total = Math.floor(process.uptime());
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      return send(sock, ctx.sender, "⏱️ NOXIS-MD\n\nUptime : " + h + "h " + m + "m " + s + "s");
    }
  },
  {
    name: "status",
    aliases: ["botstatus", "online"],
    category: "system",
    description: "Affiche l'état du bot",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender,
        "🤖 NOXIS-MD STATUS\n" +
        "🟢 WhatsApp : connecté\n" +
        "⚙️ Mode : " + config.botMode +
        "\n🏷️ Version : " + config.version
      );
    }
  },
  {
    name: "botinfo",
    aliases: ["bot", "about"],
    category: "system",
    description: "Affiche les informations du bot",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender,
        "🤖 NOXIS-MD\n\n" +
        "⚡ Version : " + config.version +
        "\n🔧 Préfixe : " + config.prefix +
        "\n🌐 Mode : " + config.botMode +
        "\n👑 Owner : " + config.owner
      );
    }
  }
];