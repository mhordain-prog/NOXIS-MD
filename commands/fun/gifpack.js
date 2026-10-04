const axios = require("axios");

const packs = {
  hello: ["wave", "smile", "happy"],
  funny: ["smile", "dance", "wink"],
  friendly: ["hug", "pat", "highfive"],
  reaction: ["blush", "surprised", "cry"],
  celebration: ["happy", "dance", "smile"]
};

module.exports = {
  name: "gifpack",
  aliases: ["packgif", "gifpackanime"],
  category: "fun",
  description: "Envoyer un pack GIF anime selon une ambiance",
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const pack = String(args[0] || "hello").toLowerCase();

    if (!packs[pack]) {
      return sock.sendMessage(jid, {
        text: "🎬 *GIF PACKS*\n\nDisponibles : " + Object.keys(packs).join(" • ") +
          "\n\nExemple : .gifpack friendly"
      });
    }

    const endpoint = packs[pack][Math.floor(Math.random() * packs[pack].length)];

    try {
      const res = await axios.get("https://api.waifu.pics/sfw/" + endpoint, { timeout: 10000 });
      if (!res.data?.url) throw new Error("GIF indisponible");

      return sock.sendMessage(jid, {
        video: { url: res.data.url },
        gifPlayback: true,
        caption:
          "📦 *NOXIS-MD • GIF PACK*\n\n" +
          "🎭 Pack : " + pack + "\n" +
          "✨ GIF anime sélectionné automatiquement !"
      });
    } catch (error) {
      console.error("GIF pack error:", error.message);
      return sock.sendMessage(jid, { text: "❌ GIF indisponible pour le moment." });
    }
  }
};