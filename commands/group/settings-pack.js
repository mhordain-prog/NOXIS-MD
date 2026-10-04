const config = require("../../config");

const send = (sock, to, text) => sock.sendMessage(to, { text });

async function requireGroup(ctx, sock) {
  if (!ctx.isGroup) {
    await send(sock, ctx.sender, "❌ Cette commande fonctionne uniquement dans un groupe.");
    return false;
  }
  return true;
}

module.exports = [
  {
    name: "open",
    aliases: ["ouvrir", "groupopen"],
    category: "group",
    description: "Autoriser tous les membres à envoyer des messages",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(ctx, sock))) return;
      await sock.groupSettingUpdate(ctx.sender, "not_announcement");
      return send(sock, ctx.sender, "🔓 Groupe ouvert.");
    }
  },
  {
    name: "close",
    aliases: ["fermer", "groupclose"],
    category: "group",
    description: "Réserver les messages aux administrateurs",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(ctx, sock))) return;
      await sock.groupSettingUpdate(ctx.sender, "announcement");
      return send(sock, ctx.sender, "🔒 Groupe fermé aux non-administrateurs.");
    }
  },
  {
    name: "groupmode",
    aliases: ["mode"],
    category: "group",
    description: "Affiche le mode de fonctionnement",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(ctx, sock))) return;
      const m = await sock.groupMetadata(ctx.sender);
      const admins = m.participants.filter(p => p.admin).length;
      return send(sock, ctx.sender, `⚙️ MODE GROUPE\n👥 Membres: ${m.participants.length}\n👑 Admins: ${admins}`);
    }
  }
];
