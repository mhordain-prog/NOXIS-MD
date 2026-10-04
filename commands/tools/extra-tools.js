const config = require("../../config");

const send = (sock, to, text) => sock.sendMessage(to, { text });

module.exports = [
  {
    name: "hashtag",
    aliases: ["hashtags", "tag"],
    category: "tools",
    description: "Génère des hashtags à partir d'un sujet",
    async execute(sock, msg, args, ctx) {
      const topic = args.join(" ").trim();
      if (!topic) return send(sock, ctx.sender, `🏷️ Usage: ${config.prefix}hashtag football`);
      const words = topic.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
      const base = words.join("");
      const tags = [...new Set([
        ...words.map(w => "#" + w),
        "#" + base,
        "#NoxisMD",
        "#WhatsAppBot"
      ])].slice(0, 12);
      return send(sock, ctx.sender, "🏷️ " + tags.join(" "));
    }
  },
  {
    name: "flag",
    aliases: ["countryflag", "drapeau"],
    category: "tools",
    description: "Affiche un drapeau à partir d'un code pays",
    async execute(sock, msg, args, ctx) {
      const code = (args[0] || "").trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(code)) return send(sock, ctx.sender, `🏳️ Usage: ${config.prefix}flag FR`);
      const emoji = [...code].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
      return send(sock, ctx.sender, `${emoji} Code pays : ${code}`);
    }
  },
  {
    name: "simdata",
    aliases: ["siminfo", "phoneinfo"],
    category: "tools",
    description: "Affiche les informations non sensibles du numéro fourni",
    async execute(sock, msg, args, ctx) {
      const raw = (args[0] || "").replace(/[^0-9+]/g, "");
      if (!raw) return send(sock, ctx.sender, `📱 Usage: ${config.prefix}simdata +242xxxxxxxxx`);
      if (!/^\+?[1-9]\d{6,14}$/.test(raw)) return send(sock, ctx.sender, "❌ Numéro invalide.");
      const normalized = raw.startsWith("+") ? raw : "+" + raw;
      return send(sock, ctx.sender, "📱 Numéro : " + normalized + "\nℹ️ NOXIS-MD n'expose aucune donnée privée de l'opérateur ou de la carte SIM.");
    }
  }
];