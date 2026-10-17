module.exports = {
  name: "promote",
  aliases: ["admin"],
  category: "group",
  description: "Promouvoir un membre administrateur",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const context = msg.message?.extendedTextMessage?.contextInfo || {};
    const target = context.mentionedJid?.[0] ||
      context.participant ||
      context.participantAlt ||
      context.participantLid;
    if (!target) {
      return sock.sendMessage(jid, { text: "❌ Mentionne le membre ou réponds à son message avec .promote." });
    }

    const meta = await sock.groupMetadata(jid);
    const digits = value => String(value || "").split(":")[0].replace(/\D/g, "");
    const matches = (member, identity) => [
      member?.id, member?.phoneNumber, member?.lid
    ].some(value => value && (value === identity ||
      (digits(value).length >= 6 && digits(value) === digits(identity))));

    const senderId = msg.key.fromMe ? sock.user?.id : (msg.key.participant || msg.key.remoteJid);
    const me = meta.participants.find(member => matches(member, senderId));
    const bot = meta.participants.find(member => matches(member, sock.user?.id) ||
      matches(member, sock.user?.lid));

    if (!me || !["admin", "superadmin"].includes(me.admin)) {
      return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur du groupe." });
    }
    if (!bot || !["admin", "superadmin"].includes(bot.admin)) {
      return sock.sendMessage(jid, { text: "❌ Le compte WhatsApp de NOXIS-MD doit être administrateur du groupe." });
    }

    const targetMember = meta.participants.find(member => matches(member, target));
    const targetJid = targetMember?.id || target;
    if (!targetMember) {
      return sock.sendMessage(jid, { text: "❌ Membre introuvable dans ce groupe." });
    }
    if (["admin", "superadmin"].includes(targetMember.admin)) {
      return sock.sendMessage(jid, { text: "ℹ️ Ce membre est déjà administrateur." });
    }

    try {
      await sock.groupParticipantsUpdate(jid, [targetJid], "promote");
      return sock.sendMessage(jid, {
        text: "👑 @"+String(targetJid).split("@")[0]+" est maintenant administrateur.",
        mentions: [targetJid]
      });
    } catch (error) {
      console.error("promote error:", error);
      return sock.sendMessage(jid, { text: "❌ Promotion impossible : " + (error.message || "erreur WhatsApp") });
    }
  }
};
