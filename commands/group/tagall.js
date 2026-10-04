module.exports = {
  name: "tagall",
  aliases: ["erfantag", "mention", "all", "tag"],
  description: "Mentionner tous les membres du groupe avec le style ERFAN",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid?.endsWith("@g.us")) return sock.sendMessage(jid, { text: "❌ Cette commande fonctionne uniquement dans un groupe." });

    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants || [];
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderMember = participants.find(p => p.id === sender);
      const isAdmin = !!senderMember && ["admin", "superadmin"].includes(senderMember.admin);
      if (!isAdmin && !msg.key.fromMe) return sock.sendMessage(jid, { text: "❌ Tu dois être administrateur pour utiliser cette commande." });

      const botNumber = sock.user?.id?.split(":")[0];
      const botJid = botNumber ? botNumber + "@s.whatsapp.net" : null;
      const botMember = participants.find(p => p.id === botJid);
      const isBotAdmin = !!botMember && ["admin", "superadmin"].includes(botMember.admin);
      if (!isBotAdmin) return sock.sendMessage(jid, { text: "❌ Le bot doit être administrateur pour utiliser .tagall." });

      const message = args?.join(" ").trim() || "Aucun message";
      const mentions = participants.map(p => p.id);
      const senderName = sender?.split("@")[0] || "admin";
      const lines = [
        "╭──〔 📢 MENTION GÉNÉRALE 〕──",
        "│",
        "│  *Message:* " + message,
        "│",
        "│  *Membres:* " + participants.length,
        "│  *From:* @" + senderName,
        "│",
        "╰───────────────",
        "",
        "┌─⊷  *TAGGED*"
      ];
      for (const participant of participants) lines.push("│  ⊳ @" + participant.id.split("@")[0]);
      lines.push("└──...", "", "> *© NOXIS-MD | ERFAN STYLE BY HORDAIN*");

      await sock.sendMessage(jid, { text: lines.join("\n"), mentions: [...mentions, sender] }, { quoted: msg });
    } catch (error) {
      console.error("tagall error:", error);
      await sock.sendMessage(jid, { text: "❌ Impossible de récupérer la liste des membres du groupe." });
    }
  }
};