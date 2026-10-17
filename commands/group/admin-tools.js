const send = (sock, to, text) => sock.sendMessage(to, { text });

async function metadata(sock, jid) {
  return sock.groupMetadata(jid);
}

function digits(value) {
  return String(value || "").split(":")[0].replace(/\D/g, "");
}

function findMember(meta, identity) {
  return meta.participants.find(member =>
    [member.id, member.phoneNumber, member.lid].some(value =>
      value && (value === identity ||
        (digits(value).length >= 6 && digits(value) === digits(identity)))
    )
  );
}

function isAdmin(meta, jid) {
  return ["admin", "superadmin"].includes(findMember(meta, jid)?.admin);
}

async function guard(sock, ctx) {
  if (!ctx.isGroup) {
    await send(sock, ctx.sender, "❌ Cette commande fonctionne uniquement dans un groupe.");
    return null;
  }
  const meta = await metadata(sock, ctx.sender);
  const senderMember = findMember(meta, ctx.senderNumber);
  if (!["admin", "superadmin"].includes(senderMember?.admin)) {
    await send(sock, ctx.sender, "❌ Réservé aux administrateurs.");
    return null;
  }
  const bot = findMember(meta, sock.user?.id) || findMember(meta, sock.user?.lid);
  if (!["admin", "superadmin"].includes(bot?.admin)) {
    await send(sock, ctx.sender, "❌ Le compte WhatsApp de NOXIS-MD doit être administrateur.");
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