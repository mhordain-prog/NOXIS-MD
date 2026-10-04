module.exports = {
  name: "repo",
  aliases: ["github"],
  category: "system",
  description: "Afficher le dépôt officiel du bot",

  async execute(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "💻 NOXIS-MD\n\n📦 GitHub : https://github.com/mhordain-prog/NOXIS-MD"
    });
  }
};