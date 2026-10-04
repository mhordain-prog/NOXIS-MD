const reactions = [
  "🔥 Incroyable !", "😂 J’en peux plus !", "😎 Trop propre !", "🤯 QUOI ?!",
  "💀 C’est fini !", "👀 Intéressant...", "🗿 Moment légendaire.",
  "⚡ Quelle énergie !", "🎭 Plot twist !", "🚀 On décolle !"
];

module.exports = {
  name: "reaction",
  aliases: ["react", "reactionfun"],
  category: "fun",
  description: "Réaction fun aléatoire",
  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    return sock.sendMessage(jid, {
      text: "🎭 *RÉACTION NOXIS*\n\n" +
        reactions[Math.floor(Math.random() * reactions.length)]
    });
  }
};