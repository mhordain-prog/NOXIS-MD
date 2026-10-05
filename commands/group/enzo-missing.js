const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data");
const bansFile = path.join(dataDir, "group-bans.json");

function loadBans() {
  try { return JSON.parse(fs.readFileSync(bansFile, "utf8")); } catch { return {}; }
}
function saveBans(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(bansFile, JSON.stringify(data, null, 2));
}
function groupOnly(jid) {
  return jid && jid.endsWith("@g.us");
}
async function meta(sock, jid) { return sock.groupMetadata(jid); }
function senderOf(msg, jid) { return msg.key.participant || msg.key.remoteJid || jid; }
function isAdmin(metadata, jid) {
  return !!metadata.participants.find(p => p.id === jid)?.admin;
}
function botIsAdmin(sock, metadata) {
  const num = sock.user?.id?.split(":")[0];
  return !!metadata.participants.find(p => p.id.startsWith(num || "__"))?.admin;
}
function targetFrom(msg, args) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (ctx?.participant) return ctx.participant;
  const raw = String(args?.[0] || "").replace(/[^0-9]/g, "");
  return raw ? raw + "@s.whatsapp.net" : null;
}
function reply(sock, jid, text) { return sock.sendMessage(jid, { text }); }

module.exports = [
  {
    name: "umute", aliases: ["unmute"], category: "group",
    description: "Rouvrir le chat du groupe",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!botIsAdmin(sock, m)) return reply(sock, jid, "❌ Je dois être administrateur.");
      await sock.groupSettingUpdate(jid, "not_announcement");
      return reply(sock, jid, "🔊 Chat rouvert : tous les membres peuvent parler.");
    }
  },
  {
    name: "close", aliases: ["mutechat"], category: "group",
    description: "Fermer le chat aux membres",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!botIsAdmin(sock, m)) return reply(sock, jid, "❌ Je dois être administrateur.");
      await sock.groupSettingUpdate(jid, "announcement");
      return reply(sock, jid, "🔒 Chat fermé : seuls les administrateurs peuvent parler.");
    }
  },
  {
    name: "open", aliases: ["openchat"], category: "group",
    description: "Ouvrir le chat aux membres",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!botIsAdmin(sock, m)) return reply(sock, jid, "❌ Je dois être administrateur.");
      await sock.groupSettingUpdate(jid, "not_announcement");
      return reply(sock, jid, "🔓 Chat ouvert.");
    }
  },
  {
    name: "purge", aliases: ["clearmsg"], category: "group",
    description: "Supprimer le message cité",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      const key = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
      const participant = msg.message?.extendedTextMessage?.contextInfo?.participant;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      if (!key || !participant) return reply(sock, jid, "⚠️ Réponds au message à supprimer.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!botIsAdmin(sock, m)) return reply(sock, jid, "❌ Je dois être administrateur.");
      await sock.sendMessage(jid, { delete: { remoteJid: jid, fromMe: false, id: key, participant } });
      return;
    }
  },
  {
    name: "ban", aliases: ["gban"], category: "security",
    description: "Bannir un membre du groupe",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid), target = targetFrom(msg, args);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!target) return reply(sock, jid, "⚠️ Réponds au membre ou indique son numéro.");
      const tm = m.participants.find(p => p.id === target);
      if (tm?.admin) return reply(sock, jid, "❌ Impossible de bannir un administrateur.");
      if (!botIsAdmin(sock, m)) return reply(sock, jid, "❌ Je dois être administrateur.");
      const bans = loadBans(); bans[jid] = [...new Set([...(bans[jid] || []), target])]; saveBans(bans);
      await sock.groupParticipantsUpdate(jid, [target], "remove");
      return reply(sock, jid, "🚫 Membre banni : @" + target.split("@")[0], { mentions: [target] });
    }
  },
  {
    name: "unban", aliases: ["ungban"], category: "security",
    description: "Retirer un membre de la liste des bannis",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid, raw = String(args?.[0] || "").replace(/[^0-9]/g, "");
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      if (!raw) return reply(sock, jid, "⚠️ Utilisation : .unban numéro");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      const target = raw + "@s.whatsapp.net", bans = loadBans();
      bans[jid] = (bans[jid] || []).filter(x => x !== target); saveBans(bans);
      return reply(sock, jid, "✅ @" + raw + " retiré de la liste des bannis.", { mentions: [target] });
    }
  },
  {
    name: "banlist", aliases: ["banned"], category: "security",
    description: "Afficher les membres bannis",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const bans = loadBans()[jid] || [];
      return reply(sock, jid, bans.length ? "🚫 *BANNIS*\n\n" + bans.map((x,i) => (i+1)+". @"+x.split("@")[0]).join("\n") : "✅ Aucun membre banni.", { mentions: bans });
    }
  },
  {
    name: "report", aliases: ["signaler"], category: "security",
    description: "Signaler un membre aux administrateurs",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const target = targetFrom(msg, args);
      const reason = args.filter(x => !/^\d+$/.test(x)).join(" ") || "Aucun motif précisé.";
      const m = await meta(sock, jid);
      if (!target) return reply(sock, jid, "⚠️ Réponds au membre à signaler.");
      const admins = m.participants.filter(p => p.admin).map(p => p.id);
      return reply(sock, jid, "🚨 *SIGNALEMENT*\n👤 Membre : @" + target.split("@")[0] + "\n📝 Motif : " + reason, { mentions: [...admins, target] });
    }
  },
  {
    name: "demoteall", aliases: ["unadminall"], category: "admin",
    description: "Retirer les droits admin aux autres administrateurs",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!botIsAdmin(sock, m)) return reply(sock, jid, "❌ Je dois être administrateur.");
      const targets = m.participants.filter(p => p.admin && p.id !== s && !p.id.startsWith(sock.user?.id?.split(":")[0] || "__")).map(p => p.id);
      if (!targets.length) return reply(sock, jid, "ℹ️ Aucun autre administrateur à rétrograder.");
      await sock.groupParticipantsUpdate(jid, targets, "demote");
      return reply(sock, jid, "✅ " + targets.length + " administrateur(s) rétrogradé(s).");
    }
  },
  {
    name: "add", aliases: ["ajouter"], category: "group",
    description: "Ajouter un membre au groupe",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid, raw = String(args?.[0] || "").replace(/[^0-9]/g, "");
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!raw) return reply(sock, jid, "⚠️ Utilisation : .add numéro");
      if (!botIsAdmin(sock, m)) return reply(sock, jid, "❌ Je dois être administrateur.");
      const target = raw + "@s.whatsapp.net";
      const result = await sock.groupParticipantsUpdate(jid, [target], "add");
      return reply(sock, jid, "📥 Demande d'ajout envoyée pour @" + raw + ".\n" + JSON.stringify(result), { mentions: [target] });
    }
  },
  {
    name: "revoke", aliases: ["resetlink"], category: "group",
    description: "Réinitialiser le lien d'invitation du groupe",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!botIsAdmin(sock, m)) return reply(sock, jid, "❌ Je dois être administrateur.");
      const code = await sock.groupRevokeInvite(jid);
      return reply(sock, jid, "🔄 Lien d'invitation réinitialisé.\n" + (code ? "Nouveau code disponible via .link" : ""));
    }
  },
  {
    name: "ginfo", aliases: ["groupinfo2"], category: "group",
    description: "Informations détaillées du groupe",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid);
      const admins = m.participants.filter(p => p.admin).length;
      return reply(sock, jid, "👥 *" + (m.subject || "Groupe") + "*\n\n🆔 " + jid + "\n👤 Membres : " + m.participants.length + "\n🛡️ Admins : " + admins + "\n📅 Créé : " + (m.creation ? new Date(m.creation * 1000).toLocaleString("fr-FR") : "inconnu"));
    }
  },
  {
    name: "setrules", aliases: ["ruleset"], category: "group",
    description: "Définir les règles du groupe",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid, rules = args.join(" ").trim();
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      if (!rules) return reply(sock, jid, "⚠️ Utilisation : .setrules vos règles");
      await sock.sendMessage(jid, { text: "📜 *RÈGLES DU GROUPE*\n\n" + rules });
      return;
    }
  },
  {
    name: "tagadmin", aliases: ["tagadmins"], category: "group",
    description: "Mentionner les administrateurs",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), admins = m.participants.filter(p => p.admin).map(p => p.id);
      return reply(sock, jid, "🛡️ *ADMINISTRATEURS*\n\n" + admins.map(x => "• @"+x.split("@")[0]).join("\n"), { mentions: admins });
    }
  },
  {
    name: "tagmembers", aliases: ["tagmember"], category: "group",
    description: "Mentionner les membres du groupe",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), members = m.participants.map(p => p.id);
      return reply(sock, jid, "👥 *MEMBRES*\n\n" + members.map(x => "• @"+x.split("@")[0]).join("\n"), { mentions: members });
    }
  },
  {
    name: "hidetag", aliases: ["silenttag"], category: "group",
    description: "Mentionner tous les membres sans afficher les numéros",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid), s = senderOf(msg, jid);
      if (!isAdmin(m, s)) return reply(sock, jid, "❌ Réservé aux administrateurs.");
      const members = m.participants.map(p => p.id);
      return reply(sock, jid, args.join(" ") || "📢 Notification", { mentions: members });
    }
  },
  {
    name: "gstatus", aliases: ["groupstatus"], category: "group",
    description: "Afficher l'état de protection du groupe",
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      if (!groupOnly(jid)) return reply(sock, jid, "❌ Groupe uniquement.");
      const m = await meta(sock, jid);
      return reply(sock, jid, "🛡️ *ÉTAT DU GROUPE*\n\n👥 Membres : " + m.participants.length + "\n🔐 Bot admin : " + (botIsAdmin(sock, m) ? "oui" : "non") + "\n📢 Mode : " + (m.announce ? "admins seulement" : "tous les membres"));
    }
  },
  {
    name: "echo", aliases: ["say"], category: "tools",
    description: "Répéter un texte",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid;
      const text = args.join(" ").trim();
      return reply(sock, jid, text || "⚠️ Utilisation : .echo texte");
    }
  },
  {
    name: "calc", aliases: ["calculate"], category: "tools",
    description: "Calculatrice simple",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid, expr = args.join(" ").replace(/[^0-9+\-*/().% ]/g, "");
      if (!expr.trim()) return reply(sock, jid, "⚠️ Utilisation : .calc 12*8");
      try {
        const result = Function('"use strict"; return (' + expr + ')')();
        if (!Number.isFinite(result)) throw new Error("invalid");
        return reply(sock, jid, "🧮 " + expr + " = " + result);
      } catch { return reply(sock, jid, "❌ Expression invalide."); }
    }
  },
  {
    name: "poll", aliases: ["sondage"], category: "tools",
    description: "Créer un sondage texte",
    async execute(sock, msg, args) {
      const jid = msg.key.remoteJid, raw = args.join(" ").trim();
      if (!raw) return reply(sock, jid, "⚠️ Utilisation : .poll Question | option 1 | option 2");
      const parts = raw.split("|").map(x => x.trim()).filter(Boolean);
      if (parts.length < 3) return reply(sock, jid, "⚠️ Ajoute une question et au moins deux options.");
      return reply(sock, jid, "📊 *SONDAGE*\n\n" + parts[0] + "\n\n" + parts.slice(1).map((x,i) => (i+1)+". "+x).join("\n") + "\n\nRéponds avec le numéro de ton choix.");
    }
  }
];
