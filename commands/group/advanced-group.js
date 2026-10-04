const config = require("../../config");

const send = (sock, jid, text, extra = {}) => sock.sendMessage(jid, { text, ...extra });

async function requireGroup(sock, ctx) {
  if (!ctx.isGroup) {
    await send(sock, ctx.sender, "❌ Cette commande fonctionne uniquement dans un groupe.");
    return false;
  }
  return true;
}

async function requireBotAdmin(sock, jid) {
  const m = await sock.groupMetadata(jid);
  const botId = String(sock.user?.id || "").split(":")[0] + "@s.whatsapp.net";
  const bot = m.participants.find(p => String(p.id) === botId);
  return !!bot?.admin;
}

module.exports = [
  {
    name: "requests",
    aliases: ["joinrequests", "demandes"],
    category: "group",
    description: "Liste les demandes d'adhésion au groupe",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(sock, ctx))) return;
      const list = await sock.groupRequestParticipantsList(ctx.sender);
      if (!list?.length) return send(sock, ctx.sender, "🙋 Aucune demande en attente.");
      const ids = list.map(x => x.jid);
      return send(sock, ctx.sender,
        "🙋 *DEMANDES D'ADHÉSION*\n\n" +
        ids.map((id, i) => (i + 1) + ". @" + id.split("@")[0]).join("\n"),
        { mentions: ids }
      );
    }
  },
  {
    name: "approve",
    aliases: ["accept", "accepter"],
    category: "group",
    description: "Accepte une demande d'adhésion mentionnée",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(sock, ctx))) return;
      if (!(await requireBotAdmin(sock, ctx.sender))) return send(sock, ctx.sender, "❌ Le bot doit être administrateur.");
      const ids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!ids.length) return send(sock, ctx.sender, "❌ Mentionne le membre à accepter.");
      await sock.groupRequestParticipantsUpdate(ctx.sender, ids, "approve");
      return send(sock, ctx.sender, "✅ Demande(s) acceptée(s).");
    }
  },
  {
    name: "reject",
    aliases: ["refuse", "refuser"],
    category: "group",
    description: "Refuse une demande d'adhésion mentionnée",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(sock, ctx))) return;
      if (!(await requireBotAdmin(sock, ctx.sender))) return send(sock, ctx.sender, "❌ Le bot doit être administrateur.");
      const ids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!ids.length) return send(sock, ctx.sender, "❌ Mentionne le membre à refuser.");
      await sock.groupRequestParticipantsUpdate(ctx.sender, ids, "reject");
      return send(sock, ctx.sender, "✅ Demande(s) refusée(s).");
    }
  },
  {
    name: "approval",
    aliases: ["joinapproval", "validation"],
    category: "group",
    description: "Active ou désactive la validation des nouveaux membres",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(sock, ctx))) return;
      if (!(await requireBotAdmin(sock, ctx.sender))) return send(sock, ctx.sender, "❌ Le bot doit être administrateur.");
      const action = String(args[0] || "status").toLowerCase();
      if (action === "on") {
        await sock.groupJoinApprovalMode(ctx.sender, "on");
        return send(sock, ctx.sender, "🛡️ Validation des demandes activée.");
      }
      if (action === "off") {
        await sock.groupJoinApprovalMode(ctx.sender, "off");
        return send(sock, ctx.sender, "🛡️ Validation des demandes désactivée.");
      }
      return send(sock, ctx.sender, "🛡️ Utilisation : .approval on | .approval off");
    }
  },
  {
    name: "addmode",
    aliases: ["memberaddmode"],
    category: "group",
    description: "Configure qui peut ajouter des membres",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(sock, ctx))) return;
      if (!(await requireBotAdmin(sock, ctx.sender))) return send(sock, ctx.sender, "❌ Le bot doit être administrateur.");
      const action = String(args[0] || "").toLowerCase();
      if (!["admin", "all"].includes(action)) return send(sock, ctx.sender, "⚙️ Utilisation : .addmode admin | .addmode all");
      await sock.groupMemberAddMode(ctx.sender, action === "admin" ? "admin_add" : "all_member_add");
      return send(sock, ctx.sender, action === "admin" ? "🔐 Seuls les admins peuvent ajouter des membres." : "🔓 Les membres peuvent ajouter des membres.");
    }
  },
  {
    name: "ephemeral",
    aliases: ["disappearing", "messages"],
    category: "group",
    description: "Configure la durée des messages éphémères",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(sock, ctx))) return;
      if (!(await requireBotAdmin(sock, ctx.sender))) return send(sock, ctx.sender, "❌ Le bot doit être administrateur.");
      const value = String(args[0] || "off").toLowerCase();
      const durations = { off: 0, "24h": 86400, "7d": 604800, "90d": 7776000 };
      if (!(value in durations)) return send(sock, ctx.sender, "⏳ Utilisation : .ephemeral off | 24h | 7d | 90d");
      await sock.groupToggleEphemeral(ctx.sender, durations[value]);
      return send(sock, ctx.sender, "⏳ Messages éphémères : *" + value + "*");
    }
  },
  {
    name: "leave",
    aliases: ["quitter"],
    category: "owner",
    description: "Faire quitter le bot du groupe",
    async execute(sock, msg, args, ctx) {
      if (!(await requireGroup(sock, ctx))) return;
      await sock.groupLeave(ctx.sender);
    }
  }
];
