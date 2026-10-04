const send = (sock, to, text) => sock.sendMessage(to, { text });

async function metadata(sock, jid) {
  return sock.groupMetadata(jid);
}

function isAdmin(meta, jid) {
  const p = meta.participants.find(x => x.id === jid);
  return !!p?.admin;
}

async function guard(sock, ctx) {
  if (!ctx.isGroup) {
    await send(sock, ctx.sender, "❌ Cette commande fonctionne uniquement dans un groupe.");
    return null;
  }
  const meta = await metadata(sock, ctx.sender);
  if (!isAdmin(meta, ctx.sender)) {
    await send(sock, ctx.sender, "❌ Réservé aux administrateurs.");
    return null;
  }
  const bot = meta.participants.find(x => x.id === sock.user?.id?.split(":")[0] + "@s.whatsapp.net" || "");
  if (!bot?.admin) {
    await send(sock, ctx.sender, "❌ Le bot doit être administrateur.");
    return null;
  }
  return meta;
}

module.exports = [
  {
    name: "resetdesc",
    aliases: ["cleardesc", "cleardescription"],
    category: "group",
    description: "Efface la description du groupe",
    async execute(sock, msg, args, ctx) {
      if (!await guard(sock, ctx)) return;
      try {
        await sock.groupUpdateDescription(ctx.sender, "");
        return send(sock, ctx.sender, "🧹 Description supprimée.");
      } catch {
        return send(sock, ctx.sender, "❌ Impossible de modifier la description.");
      }
    }
  },
  {
    name: "promoteall",
    aliases: ["makeadmins"],
    category: "group",
    description: "Promouvoir les membres mentionnés",
    async execute(sock, msg, args, ctx) {
      const meta = await guard(sock, ctx);
      if (!meta) return;
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentions.length) return send(sock, ctx.sender, "👑 Mentionne au moins un membre.");
      const targets = mentions.filter(jid => !isAdmin(meta, jid));
      if (!targets.length) return send(sock, ctx.sender, "ℹ️ Les membres mentionnés sont déjà administrateurs.");
      await sock.groupParticipantsUpdate(ctx.sender, targets, "promote");
      return send(sock, ctx.sender, "👑 Promotion effectuée pour " + targets.length + " membre(s).");
    }
  },
  {
    name: "demoteall",
    aliases: ["removeadmins"],
    category: "group",
    description: "Retirer le statut admin des membres mentionnés",
    async execute(sock, msg, args, ctx) {
      const meta = await guard(sock, ctx);
      if (!meta) return;
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentions.length) return send(sock, ctx.sender, "👑 Mentionne au moins un administrateur.");
      const targets = mentions.filter(jid => isAdmin(meta, jid) && jid !== ctx.sender);
      if (!targets.length) return send(sock, ctx.sender, "ℹ️ Aucun administrateur ciblé ne peut être rétrogradé.");
      await sock.groupParticipantsUpdate(ctx.sender, targets, "demote");
      return send(sock, ctx.sender, "⬇️ Statut admin retiré pour " + targets.length + " membre(s).");
    }
  }
];