const config = require("../../config");

const send = (sock, to, text, extra = {}) => sock.sendMessage(to, { text, ...extra });

function targets(msg, args) {
  const c = msg.message?.extendedTextMessage?.contextInfo;
  if (c?.mentionedJid?.length) return c.mentionedJid;
  return args.filter(x => /^\d{6,20}$/.test(x)).map(x => x + "@s.whatsapp.net");
}

module.exports = [
  {
    name: "warn",
    aliases: ["avertir"],
    category: "security",
    description: "Avertissement local",
    async execute(sock, msg, args, ctx) {
      if (!ctx.isGroup) return send(sock, ctx.sender, "❌ Groupe uniquement.");
      const ids = targets(msg, args);
      if (!ids.length) return send(sock, ctx.sender, "❌ Mentionne le membre.");
      return send(sock, ctx.sender, "⚠️ Avertissement enregistré pour " + ids.map(x => "@" + x.split("@")[0]).join(", "), { mentions: ids });
    }
  },
  {
    name: "protect",
    aliases: ["security"],
    category: "security",
    description: "Affiche les protections disponibles",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender,
        "🛡️ NOXIS SECURITY\n" +
        "• Contrôle des permissions actif\n" +
        "• Gestion admin disponible\n" +
        "• Commandes de modération disponibles\n" +
        "• Anti-spam avancé: à configurer"
      );
    }
  },
  {
    name: "owner",
    aliases: ["creator", "proprietaire"],
    category: "owner",
    description: "Informations du propriétaire configuré",
    async execute(sock, msg, args, ctx) {
      const owner = String(config.owner || "").replace(/\D/g, "");
      return send(sock, ctx.sender, owner && !owner.includes("X") ? "👑 Owner: +" + owner : "👑 Owner: non configuré");
    }
  }
];
