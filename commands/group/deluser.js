module.exports = {
  name: "deluser",
  aliases: ["delspam", "purge"],
  category: "group",
  description: "Supprimer jusqu'à 20 messages récents d'un utilisateur ciblé",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    const quotedParticipants = [
      contextInfo.participant,
      contextInfo.participantAlt,
      contextInfo.participantLid
    ].filter(Boolean);
    const quoted = contextInfo.quotedMessage;
    if (!quoted || !quotedParticipants.length) {
      return sock.sendMessage(jid, {
        text: "❌ Réponds à un message de la personne ciblée avec : .deluser 20"
      });
    }

    const meta = await sock.groupMetadata(jid);
    const digits = value => String(value || "").split(":")[0].replace(/\D/g, "");
    const matches = (member, identity) => [
      member?.id, member?.phoneNumber, member?.lid
    ].some(value => value && (value === identity ||
      (digits(value).length >= 6 && digits(value) === digits(identity))));

    const senderId = msg.key.fromMe ? sock.user?.id : (msg.key.participant || msg.key.remoteJid);
    const senderMember = meta.participants.find(member => matches(member, senderId));
    const botMember = meta.participants.find(member =>
      matches(member, sock.user?.id) || matches(member, sock.user?.lid)
    );

    if (!senderMember || !["admin", "superadmin"].includes(senderMember.admin)) {
      return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur du groupe pour utiliser cette commande." });
    }
    if (!botMember || !["admin", "superadmin"].includes(botMember.admin)) {
      return sock.sendMessage(jid, { text: "❌ Le compte WhatsApp de NOXIS-MD doit être administrateur du groupe pour supprimer les messages des membres." });
    }

    const targetMember = meta.participants.find(member =>
      quotedParticipants.some(identity => matches(member, identity))
    );
    if (targetMember && ["admin", "superadmin"].includes(targetMember.admin)) {
      return sock.sendMessage(jid, { text: "❌ Cette commande ne cible pas les administrateurs." });
    }

    const requested = Math.min(Math.max(parseInt(args[0], 10) || 20, 1), 20);

    try {
      if (typeof sock.getRecentMessagesByParticipant !== "function") {
        return sock.sendMessage(jid, {
          text: "❌ Le cache des messages n'est pas disponible. Redémarre NOXIS-MD après la mise à jour."
        });
      }

      const targetMessages = await sock.getRecentMessagesByParticipant(jid, quotedParticipants, requested);
      if (!targetMessages.length) {
        return sock.sendMessage(jid, {
          text: "⚠️ Aucun message récent de cette personne n'est disponible dans le cache. Les anciens messages non mémorisés ne peuvent pas être récupérés."
        });
      }

      let deleted = 0;
      let failed = 0;
      for (const target of targetMessages) {
        try {
          await sock.sendMessage(jid, { delete: target.key });
          deleted++;
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          failed++;
          console.error("deluser delete error:", error.message);
        }
      }

      const targetId = targetMember?.id || quotedParticipants[0];
      await sock.sendMessage(jid, {
        text: `🧹 Deluser terminé pour @${String(targetId).split("@")[0]} : ${deleted}/${targetMessages.length} message(s) supprimé(s).${failed ? ` Échecs : ${failed}.` : ""}\nℹ️ Limite : 20 messages récents mémorisés au maximum.`,
        mentions: [targetId]
      });
    } catch (error) {
      console.error("deluser error:", error);
      await sock.sendMessage(jid, { text: "❌ Erreur pendant la récupération ou la suppression des messages." });
    }
  }
};
