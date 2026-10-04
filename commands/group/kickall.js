module.exports = {
  name: "kickall",
  aliases: ["kickel", "purgegroup"],
  description: "Retirer les membres non-administrateurs du groupe",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!jid?.endsWith("@g.us")) {
      return sock.sendMessage(jid, {
        text: "❌ Cette commande fonctionne uniquement dans un groupe."
      });
    }

    try {
      const metadata = await sock.groupMetadata(jid);
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderMember = metadata.participants.find(p => p.id === sender);

      if (!senderMember || !["admin", "superadmin"].includes(senderMember.admin)) {
        return sock.sendMessage(jid, {
          text: "❌ Tu dois être administrateur pour utiliser cette commande."
        });
      }

      const targets = metadata.participants
        .filter(p => p.id !== sender && !["admin", "superadmin"].includes(p.admin))
        .map(p => p.id);

      if (!targets.length) {
        return sock.sendMessage(jid, {
          text: "ℹ️ Aucun membre non-administrateur à retirer."
        });
      }

      if (args.join(" ").toLowerCase() !== "confirmer") {
        return sock.sendMessage(jid, {
          text:
            `⚠️ PURGE DU GROUPE\n\n👥 Groupe : ${metadata.subject || "Groupe WhatsApp"}\n📊 Membres concernés : ${targets.length}\n\nCette commande retirera tous les membres non-administrateurs.\n\n👉 Tape : kickall confirmer`
        });
      }

      await sock.sendMessage(jid, {
        text: `🧹 Purge lancée : ${targets.length} membre(s) vont être retiré(s).`
      });

      for (const participant of targets) {
        try {
          await sock.groupParticipantsUpdate(jid, [participant], "remove");
        } catch (error) {
          console.error("kickall participant error:", error);
        }
      }

      await sock.sendMessage(jid, {
        text: "✅ Purge terminée. Les membres non-administrateurs ont été retirés."
      });
    } catch (error) {
      console.error("kickall error:", error);
      await sock.sendMessage(jid, {
        text: "❌ Impossible d'effectuer la purge du groupe."
      });
    }
  }
};
