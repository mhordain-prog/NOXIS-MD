module.exports = {
  name: "tagadmins",
  aliases: ["admins", "mentionadmins"],
  category: "group",
  description: "Mentionner les administrateurs",
  async execute(sock, msg, args, c) {
    if (!c.isGroup) return sock.sendMessage(c.sender, { text: "❌ Utilise cette commande dans un groupe." });
    const metadata = await sock.groupMetadata(c.sender);
    const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
    if (!admins.length) return sock.sendMessage(c.sender, { text: "❌ Aucun administrateur trouvé." });
    const text = args.join(" ").trim() || "👑 Administrateurs du groupe";
    await sock.sendMessage(c.sender, { text, mentions: admins });
  }
};