module.exports = {
  name: "antilink",
  aliases: ["nolink", "linkguard"],
  description: "Supprimer les liens envoyés par les membres non-administrateurs",

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

      const action = (args[0] || "").toLowerCase();

      if (!["on", "off"].includes(action)) {
        return sock.sendMessage(jid, {
          text: "ℹ️ Utilisation : antilink on ou antilink off"
        });
      }

      const enabled = action === "on";

      await sock.sendMessage(jid, {
        text: enabled
          ? "🛡️ ANTI-LINK activé. Les liens des membres non-administrateurs seront supprimés."
          : "🛡️ ANTI-LINK désactivé."
      });

      // L'état doit être persisté par le système de configuration du bot.
      // Le handler principal doit appeler ce module avec la configuration du groupe.
    } catch (error) {
      console.error("antilink error:", error);
      await sock.sendMessage(jid, {
        text: "❌ Impossible de modifier l'anti-link."
      });
    }
  }
};