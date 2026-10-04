module.exports = {
  name: "promote",
  aliases: ["admin"],
  category: "group",
  description: "Promouvoir un membre administrateur",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groupe uniquement." });
    const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!target) return sock.sendMessage(jid, { text: "❌ Réponds au membre à promouvoir." });
    const meta = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const me = meta.participants.find(p => p.id === sender);
    const botId = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
    const bot = meta.participants.find(p => p.id === botId);
    if (!["admin","superadmin"].includes(me?.admin)) return sock.sendMessage(jid, { text: "❌ Admin requis." });
    if (!bot?.admin) return sock.sendMessage(jid, { text: "❌ Le bot doit être administrateur." });
    await sock.groupParticipantsUpdate(jid, [target], "promote");
    return sock.sendMessage(jid, { text: `👑 @${target.split("@")[0]} est maintenant administrateur.`, mentions: [target] });
  }
};