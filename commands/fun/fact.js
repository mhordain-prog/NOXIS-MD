module.exports = {
  name: "fact",
  aliases: ["funfact"],
  description: "Donner un fait amusant",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const facts = ['🧠 Les pieuvres ont trois cœurs.', '🌍 La Terre tourne sur elle-même.', '🐝 Les abeilles communiquent notamment par des mouvements.', '🌈 Un arc-en-ciel est lié à la dispersion de la lumière.']; return sock.sendMessage(jid, { text: facts[Math.floor(Math.random() * facts.length)] });
  }
};