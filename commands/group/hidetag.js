module.exports = {
  name: "hidetag",
  aliases: ["notify", "silenttag"],
  category: "group",
  description: "Mentionner tous les membres sans afficher les numéros",
  async execute(sock, msg, args, c) {
    if (!c.isGroup) return sock.sendMessage(c.sender, { text: "❌ Utilise cette commande dans un groupe." });
    const metadata = await sock.groupMetadata(c.sender);
    const mentions = metadata.participants.map(p => p.id);
    const text = args.join(" ").trim() || "📢 Notification NOXIS";
    await sock.sendMessage(c.sender, { text, mentions });
  }
};