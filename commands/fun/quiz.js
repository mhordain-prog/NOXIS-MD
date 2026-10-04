module.exports = {
  name: "quiz",
  aliases: ["question"],
  description: "Poser une question quiz",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const qs = [
      {q:'🧠 Quelle planète est surnommée la planète rouge ?', a:'Mars'},
      {q:'🧠 Combien de côtés possède un hexagone ?', a:'6'},
      {q:'🧠 Quel est le plus grand océan ?', a:'Pacifique'},
      {q:'🧠 Combien font 7 × 8 ?', a:'56'}
    ];
    const x = qs[Math.floor(Math.random() * qs.length)];
    return sock.sendMessage(jid, { text: x.q + '\n\nRéponds dans le groupe !' });
  }
};