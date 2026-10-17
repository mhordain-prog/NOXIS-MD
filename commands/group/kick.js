module.exports = {
  name: "kick",
  aliases: ["remove"],
  category: "group",
  description: "Retirer un membre du groupe",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Groupe uniquement." });

    const ctx = msg.message?.extendedTextMessage?.contextInfo || {};
    const target = ctx.mentionedJid?.[0] || ctx.participant || ctx.participantAlt || ctx.participantLid;
    if (!target) return sock.sendMessage(jid, { text: "❌ Mentionne le membre ou réponds à son message." });

    const meta = await sock.groupMetadata(jid);
    const digits = value => String(value || "").split(":")[0].replace(/\D/g, "");
    const matches = (member, identity) => [member?.id, member?.phoneNumber, member?.lid]
      .some(value => value && (value === identity ||
        (digits(value).length >= 6 && digits(value) === digits(identity))));
    const senderId = msg.key.fromMe ? sock.user?.id : (msg.key.participant || msg.key.remoteJid);
    const me = meta.participants.find(member => matches(member, senderId));
    const bot = meta.participants.find(member => matches(member, sock.user?.id) || matches(member, sock.user?.lid));
    const member = meta.participants.find(item => matches(item, target));

    if (!me || !["admin", "superadmin"].includes(me.admin)) return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur du groupe." });
    if (!bot || !["admin", "superadmin"].includes(bot.admin)) return sock.sendMessage(jid, { text: "❌ Le compte WhatsApp de NOXIS-MD doit être administrateur du groupe." });
    if (!member) return sock.sendMessage(jid, { text: "❌ Membre introuvable dans ce groupe." });
    if (["admin", "superadmin"].includes(member.admin)) return sock.sendMessage(jid, { text: "❌ Impossible de retirer un administrateur." });

    try {
      await sock.groupParticipantsUpdate(jid, [member.id], "remove");
      return sock.sendMessage(jid, { text: `✅ @${String(member.id).split("@")[0]} a été retiré(e).`, mentions: [member.id] });
    } catch (error) {
      console.error("kick error:", error);
      return sock.sendMessage(jid, { text: "❌ Retrait impossible : " + (error.message || "erreur WhatsApp") });
    }
  }
};
