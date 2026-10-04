const axios = require("axios");

const actions = [
  ["slap", "👋", "gifle cartoon"],
  ["bonk", "🔨", "bonk cartoon"],
  ["kick", "🦵", "coup de pied cartoon"],
  ["pat", "🫳", "tapotement amical"],
  ["hug", "🤗", "câlin amical"],
  ["poke", "👉", "taquinerie"],
  ["highfive", "🙌", "high-five"],
  ["wave", "👋", "salut"]
];

function getTarget(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  return ctx?.mentionedJid?.[0] || ctx?.participant || null;
}

module.exports = {
  name: "gifduel",
  aliases: ["duelgif", "gifbattle"],
  category: "fun",
  description: "Envoyer une interaction GIF anime aléatoire à une personne",
  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    const target = getTarget(msg);

    if (!target) {
      return sock.sendMessage(jid, {
        text: "🎯 Mentionne quelqu’un ou réponds à son message.\nExemple : .gifduel @membre"
      });
    }

    const [endpoint, emoji, label] = actions[Math.floor(Math.random() * actions.length)];

    try {
      const res = await axios.get("https://api.waifu.pics/sfw/" + endpoint, { timeout: 10000 });
      if (!res.data?.url) throw new Error("GIF indisponible");

      return sock.sendMessage(jid, {
        video: { url: res.data.url },
        gifPlayback: true,
        caption:
          "⚔️ *NOXIS-MD • GIF BATTLE*\n\n" +
          emoji + " Interaction : " + label + "\n" +
          "🎯 Cible : @" + target.split("@")[0] +
          "\n\n😂 Mode cartoon / fun !",
        mentions: [target]
      });
    } catch (error) {
      console.error("GIF duel error:", error.message);
      return sock.sendMessage(jid, {
        text: "❌ Impossible de récupérer le GIF pour le moment."
      });
    }
  }
};