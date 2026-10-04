module.exports = {
  name: "tagall",
  aliases: ["mentionall", "everyone"],
  description: "Afficher et mentionner tous les membres du groupe",

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

      const participants = metadata.participants || [];
      const mentions = participants.map(p => p.id);

      const lines = [
        "╭━━━〔 🔥 NOXIS-MD 🔥 〕━━━╮",
        `│ 👥 Groupe : ${metadata.subject || "Groupe WhatsApp"}`,
        `│ 👤 Membres : ${participants.length}`,
        "│ 📋 Liste des membres",
        "╰━━━━━━━━━━━━━━━━━━━━━━╯"
      ];

      participants.forEach((participant, index) => {
        lines.push(String(index + 1));
        lines.push(`@${participant.id.split("@")[0]}`);
      });

      if (args.length) {
        lines.push(args.join(" "));
      }

      lines.push("╰━━━〔 ✪ NOXIS-MD ✪ 〕━━━╯");

      await sock.sendMessage(jid, {
        text: lines.join("\n"),
        mentions
      });
    } catch (error) {
      console.error("tagall error:", error);
      await sock.sendMessage(jid, {
        text: "❌ Impossible de récupérer la liste des membres du groupe."
      });
    }
  }
};
