module.exports = {
  name: "deluser",
  aliases: ["delspam"],
  description: "Supprimer jusqu'à 20 messages récents d'un utilisateur ciblé",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, {
        text: "❌ Cette commande fonctionne uniquement dans un groupe."
      });
    }

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedParticipant =
      msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!quoted || !quotedParticipant) {
      return sock.sendMessage(jid, {
        text: "❌ Réponds au message du spammeur avec : .deluser 20"
      });
    }

    const metadata = await sock.groupMetadata(jid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderMember = metadata.participants.find(p => p.id === sender);

    if (!senderMember || !["admin", "superadmin"].includes(senderMember.admin)) {
      return sock.sendMessage(jid, {
        text: "❌ Tu dois être administrateur pour utiliser cette commande."
      });
    }

    const targetMember = metadata.participants.find(p => p.id === quotedParticipant);

    if (targetMember && ["admin", "superadmin"].includes(targetMember.admin)) {
      return sock.sendMessage(jid, {
        text: "❌ Cette commande ne cible pas les administrateurs."
      });
    }

    const requested = Math.min(Math.max(parseInt(args[0], 10) || 20, 1), 20);

    try {
      const messages = await sock.fetchMessagesFromWA(jid, 100);
      const targetMessages = messages
        .filter(m =>
          m?.key?.remoteJid === jid &&
          m?.key?.participant === quotedParticipant &&
          !m?.key?.fromMe
        )
        .slice(0, requested);

      let deleted = 0;

      for (const target of targetMessages) {
        try {
          await sock.sendMessage(jid, {
            delete: target.key
          });
          deleted++;
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error("deluser delete error:", error);
        }
      }

      await sock.sendMessage(jid, {
        text: `🧹 Deluser terminé : ${deleted}/${requested} message(s) supprimé(s).`
      });
    } catch (error) {
      console.error("deluser error:", error);
      await sock.sendMessage(jid, {
        text: "❌ Impossible de récupérer les messages à supprimer."
      });
    }
  }
};