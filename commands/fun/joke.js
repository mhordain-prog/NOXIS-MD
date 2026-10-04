module.exports = {
  name: "joke",
  aliases: ["blague"],
  description: "Raconter une blague courte",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const jokes = ['😂 Pourquoi le livre est-il allé à l’école ? Pour apprendre à tourner la page.', '😂 Que dit un ordinateur quand il a froid ? Il ferme ses fenêtres.', '😂 Pourquoi le café est-il toujours calme ? Parce qu’il garde son sang-froid.']; return sock.sendMessage(jid, { text: jokes[Math.floor(Math.random() * jokes.length)] });
  }
};