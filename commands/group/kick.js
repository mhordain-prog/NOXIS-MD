module.exports = {
  name: "kick",
  aliases: ["remove"],
  category: "group",
  description: "Retirer un membre du groupe",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groupe uniquement." });

    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const target = ctx?.participant;
    if (!target) return sock.sendMessage(jid, { text: "❌ Réponds au message du membre à retirer." });

    const meta = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const me = meta.participants.find(p => p.id === sender);
    const botId = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
    const bot = meta.participants.find(p => p.id === botId);
    const member = meta.participants.find(p => p.id === target);

    if (!["admin","superadmin"].includes(me?.admin)) return sock.sendMessage(jid, { text: "❌ Admin requis." });
    if (!bot?.admin) return sock.sendMessage(jid, { text: "❌ Le bot doit être administrateur." });
    if (member && ["admin","superadmin"].includes(member.admin)) return sock.sendMessage(jid, { text: "❌ Impossible de retirer un administrateur." });

    await sock.groupParticipantsUpdate(jid, [target], "remove");
    return sock.sendMessage(jid, { text: `✅ @${target.split("@")[0]} a été retiré(e).`, mentions: [target] });
  }
};