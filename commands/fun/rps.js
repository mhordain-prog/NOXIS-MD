module.exports = {
  name: "rps",
  aliases: ["chifoumi"],
  description: "Jouer à pierre feuille ciseaux",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const choices = ['🪨 Pierre','📄 Feuille','✂️ Ciseaux']; const bot = choices[Math.floor(Math.random() * choices.length)]; const user = args.join(' ').toLowerCase(); const map = { pierre:'🪨 Pierre', feuille:'📄 Feuille', ciseaux:'✂️ Ciseaux' }; if (!map[user]) return sock.sendMessage(jid, { text: '⚠️ Utilisation : .rps pierre | feuille | ciseaux' }); const u = map[user]; const win = (u.includes('Pierre') && bot.includes('Ciseaux')) || (u.includes('Feuille') && bot.includes('Pierre')) || (u.includes('Ciseaux') && bot.includes('Feuille')); const result = u === bot ? '🤝 Égalité !' : win ? '🏆 Tu gagnes !' : '🤖 Je gagne !'; return sock.sendMessage(jid, { text: u + ' vs ' + bot + '\n' + result });
  }
};