module.exports = {
  name: "8ballplus",
  aliases: ["magicball"],
  description: "Réponse ludique avancée à une question",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const a = ['✨ Absolument.', '🌙 Les signes sont favorables.', '🎱 Pas cette fois.', '🤔 C’est incertain.', '⚡ Très probable.'];
    const q = args.join(' ').trim();
    if (!q) return sock.sendMessage(jid, { text: '⚠️ Utilisation : .8ballplus Ta question' });
    return sock.sendMessage(jid, { text: '🔮 ' + a[Math.floor(Math.random() * a.length)] });
  }
};