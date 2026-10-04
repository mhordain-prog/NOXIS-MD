module.exports = {
  name: "truth",
  aliases: ["verite"],
  description: "Donner une question vérité ludique",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const qs = ['🤔 Quelle est une chose que tu aimerais apprendre ?', '🤔 Quel est ton jeu préféré ?', '🤔 Quelle compétence aimerais-tu maîtriser ?', '🤔 Quel est ton meilleur souvenir drôle ?']; return sock.sendMessage(jid, { text: qs[Math.floor(Math.random() * qs.length)] });
  }
};