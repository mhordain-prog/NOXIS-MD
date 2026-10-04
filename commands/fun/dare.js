module.exports = {
  name: "dare",
  aliases: ["action"],
  description: "Donner un défi ludique et sans danger",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const ds = ['🎯 Fais 10 secondes de pose de victoire.', '🎯 Écris un compliment sincère à quelqu’un du groupe.', '🎯 Envoie ton emoji préféré.', '🎯 Écris une phrase sans utiliser la lettre A.']; return sock.sendMessage(jid, { text: ds[Math.floor(Math.random() * ds.length)] });
  }
};