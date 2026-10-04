const config = require("../../config");

const getTargetIds = (msg, args) => {
  const c = msg.message?.extendedTextMessage?.contextInfo;
  const ids = c?.mentionedJid || [];
  if (ids.length) return ids;
  return args.filter(x => /^\\d{6,20}$/.test(x)).map(x => x + "@s.whatsapp.net");
};

const send = (sock, to, text, extra = {}) => sock.sendMessage(to, { text, ...extra });

async function execute(sock, msg, args, ctx) {
  const parts = ctx.text.slice(config.prefix.length).trim().split(/\\s+/);
  const cmd = (parts[0] || "").toLowerCase();
  const rest = parts.slice(1);
  const group = ctx.isGroup;
  const to = ctx.sender;

  if (cmd === "alive" || cmd === "status" || cmd === "bot") {
    return send(sock, to, `🤖 NOXIS-MD\n🟢 ONLINE\n⚡ Version: ${config.version}\n⚙️ Prefix: ${config.prefix}`);
  }
  if (cmd === "id" || cmd === "chatid") return send(sock, to, `🆔 ${to}`);
  if (cmd === "groupinfo" || cmd === "ginfo") {
    if (!group) return send(sock, to, "❌ Groupe uniquement.");
    const m = await sock.groupMetadata(to);
    return send(sock, to, `👥 ${m.subject}\n👤 Membres: ${m.participants.length}\n🆔 ${m.id}`);
  }
  if (cmd === "admins" || cmd === "adminlist") {
    if (!group) return send(sock, to, "❌ Groupe uniquement.");
    const m = await sock.groupMetadata(to);
    const ids = m.participants.filter(p => p.admin).map(p => p.id);
    return send(sock, to, "👑 ADMINS\n" + ids.map(j => "@" + j.split("@")[0]).join("\n"), { mentions: ids });
  }
  if (cmd === "tagall" || cmd === "everyone" || cmd === "mentionall") {
    if (!group) return send(sock, to, "❌ Groupe uniquement.");
    const m = await sock.groupMetadata(to);
    const ids = m.participants.map(p => p.id);
    return send(sock, to, "📢 " + (rest.join(" ") || "Mention générale") + "\n\n" + ids.map(j => "@" + j.split("@")[0]).join(" "), { mentions: ids });
  }
  if (["kick","remove","promote","demote"].includes(cmd)) {
    if (!group) return send(sock, to, "❌ Groupe uniquement.");
    const ids = getTargetIds(msg, rest);
    if (!ids.length) return send(sock, to, "❌ Mentionne le membre concerné.");
    const action = cmd === "kick" || cmd === "remove" ? "remove" : cmd;
    await sock.groupParticipantsUpdate(to, ids, action);
    return send(sock, to, "✅ Action effectuée.");
  }
  if (cmd === "subject" || cmd === "setname") {
    if (!group) return send(sock, to, "❌ Groupe uniquement.");
    const value = rest.join(" ");
    if (!value) return send(sock, to, `Usage: ${config.prefix}subject Nouveau nom`);
    await sock.groupUpdateSubject(to, value);
    return send(sock, to, "✅ Nom modifié.");
  }
  if (cmd === "desc" || cmd === "setdesc") {
    if (!group) return send(sock, to, "❌ Groupe uniquement.");
    const value = rest.join(" ");
    if (!value) return send(sock, to, `Usage: ${config.prefix}desc Description`);
    await sock.groupUpdateDescription(to, value);
    return send(sock, to, "✅ Description modifiée.");
  }
  if (cmd === "invite" || cmd === "link") {
    if (!group) return send(sock, to, "❌ Groupe uniquement.");
    const code = await sock.groupInviteCode(to);
    return send(sock, to, `🔗 https://chat.whatsapp.com/${code}`);
  }
  if (cmd === "revoke") {
    if (!group) return send(sock, to, "❌ Groupe uniquement.");
    await sock.groupRevokeInvite(to);
    return send(sock, to, "✅ Lien révoqué.");
  }
  if (cmd === "poll" || cmd === "sondage") {
    const p = rest.join(" ").split("|").map(x => x.trim()).filter(Boolean);
    if (p.length < 3) return send(sock, to, `Usage: ${config.prefix}poll Question | Option 1 | Option 2`);
    return sock.sendMessage(to, { poll: { name: p[0], values: p.slice(1), selectableCount: 1 } });
  }
  if (cmd === "react" || cmd === "reaction") {
    const c = msg.message?.extendedTextMessage?.contextInfo;
    if (!c?.stanzaId) return send(sock, to, `❌ Réponds à un message avec ${config.prefix}react 👍`);
    return sock.sendMessage(to, { react: { text: rest[0] || "❤️", key: { remoteJid: to, fromMe: false, id: c.stanzaId, participant: c.participant } } });
  }
  if (cmd === "read" || cmd === "seen") {
    await sock.readMessages([msg.key]);
    return send(sock, to, "✅ Lu.");
  }
  if (cmd === "runtime") {
    const s = Math.floor(process.uptime());
    return send(sock, to, `⏱️ Uptime: ${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`);
  }
  if (cmd === "pollhelp") return send(sock, to, "📊 Sondage: .poll Question | Option 1 | Option 2");
  return send(sock, to, "❌ Commande non reconnue par le pack.");
}

module.exports = {
  name: "suite",
  aliases: [
    "alive","status","bot","id","chatid","groupinfo","ginfo","admins","adminlist",
    "tagall","everyone","mentionall","kick","remove","promote","demote","subject",
    "setname","desc","setdesc","invite","link","revoke","poll","sondage","react",
    "reaction","read","seen","runtime","pollhelp"
  ],
  category: "tools",
  description: "Expanded NOXIS-MD feature suite"
  , execute
};
