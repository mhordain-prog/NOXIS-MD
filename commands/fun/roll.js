module.exports = {
  name: "roll",
  aliases: ["random"],
  description: "Générer un nombre aléatoire",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const max = Math.max(1, Math.min(Number.parseInt(args[0], 10) || 100, 1000000)); const n = Math.floor(Math.random() * max) + 1; return sock.sendMessage(jid, { text: '🎯 Nombre : ' + n + ' / ' + max });
  }
};