module.exports = {
  name: "rate",
  aliases: [],
  description: "Donner une note ludique sur 10",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || msg.key.participant || jid;

    if ("rate" === 'ship') {
      const second = mentioned[1];
      if (!second) return sock.sendMessage(jid, { text: '⚠️ Utilisation : .ship @user1 @user2' });
      const key = [target, second].sort().join(':');
      let score = 0;
      for (let i = 0; i < key.length; i++) score = (score * 31 + key.charCodeAt(i)) % 101;
      return sock.sendMessage(jid, { text: '💘 Compatibilité : ' + score + '%' });
    }

    if ("rate" === 'lovetest') {
      const score = Math.floor(Math.random() * 101);
      return sock.sendMessage(jid, { text: '❤️ Test d’amour : ' + score + '%' });
    }

    if ("rate" === 'wife') {
      const list = mentioned.length ? mentioned : [target];
      const chosen = list[Math.floor(Math.random() * list.length)];
      return sock.sendMessage(jid, { text: '💍 Épouse fictive choisie : @' + chosen.split('@')[0], mentions: [chosen] });
    }

    if ("rate" === 'husband') {
      const list = mentioned.length ? mentioned : [target];
      const chosen = list[Math.floor(Math.random() * list.length)];
      return sock.sendMessage(jid, { text: '💍 Mari fictif choisi : @' + chosen.split('@')[0], mentions: [chosen] });
    }

    if ("rate" === 'aura') {
      const auras = ['✨ Mystérieuse', '🔥 Énergique', '🌙 Sombre', '⚡ Puissante', '🌟 Brillante'];
      return sock.sendMessage(jid, { text: '🔮 Aura : ' + auras[Math.floor(Math.random() * auras.length)] + ' — @' + target.split('@')[0], mentions: [target] });
    }

    if ("rate" === 'roast') {
      const lines = ['😈 Niveau légendaire de malchance aujourd’hui.', '😂 Même le hasard hésite avec toi.', '🔥 Petit roast : ton niveau de chaos est impressionnant.'];
      return sock.sendMessage(jid, { text: lines[Math.floor(Math.random() * lines.length)] + ' @' + target.split('@')[0], mentions: [target] });
    }

    if ("rate" === 'rate') {
      const score = Math.floor(Math.random() * 11);
      return sock.sendMessage(jid, { text: '⭐ Note fun : ' + score + '/10 — @' + target.split('@')[0], mentions: [target] });
    }

    if ("rate" === 'simp') {
      const score = Math.floor(Math.random() * 101);
      return sock.sendMessage(jid, { text: '🥹 Score simp : ' + score + '% — @' + target.split('@')[0], mentions: [target] });
    }

    if ("rate" === 'character') {
      const chars = ['🦸 Héros', '🧙 Mage', '🥷 Ninja', '🤖 Stratège', '👑 Boss final'];
      return sock.sendMessage(jid, { text: '🎭 Personnage : ' + chars[Math.floor(Math.random() * chars.length)] + ' — @' + target.split('@')[0], mentions: [target] });
    }
  }
};