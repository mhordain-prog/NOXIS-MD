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
      if (typeof sock.getRecentMessagesByParticipant !== "function") {
        return sock.sendMessage(jid, {
          text: "❌ Le cache des messages n'est pas disponible. Redémarre NOXIS-MD après la mise à jour."
        });
      }

      // Baileys ne fournit pas fetchMessagesFromWA : on utilise les messages
      // réellement reçus et conservés dans le cache runtime de NOXIS-MD.
      const targetMessages = sock.getRecentMessagesByParticipant(
        jid,
        quotedParticipant,
        requested
      );

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

      await sock.sendMessage(jid, {
        text: `🧹 Deluser terminé pour @${String(quotedParticipant).split("@")[0]} : ${deleted}/${targetMessages.length} message(s) supprimé(s).${failed ? ` Échecs : ${failed}.` : ""}\nℹ️ Limite : 20 messages récents mémorisés au maximum.`,
        mentions: [quotedParticipant]
      });
    } catch (error) {
      console.error("deluser error:", error);
      await sock.sendMessage(jid, {
        text: "❌ Erreur pendant la récupération ou la suppression des messages."
      });
    }
  }
};