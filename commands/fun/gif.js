const axios = require("axios");

const TYPES = {
  anime: "https://api.waifu.pics/sfw/waifu",
  neko: "https://api.waifu.pics/sfw/neko",
  cute: "https://api.waifu.pics/sfw/waifu",
  happy: "https://api.waifu.pics/sfw/happy",
  dance: "https://api.waifu.pics/sfw/dance",
  wink: "https://api.waifu.pics/sfw/wink",
  blush: "https://api.waifu.pics/sfw/blush",
  cry: "https://api.waifu.pics/sfw/cry",
  smile: "https://api.waifu.pics/sfw/smile",
  wave: "https://api.waifu.pics/sfw/wave",
  pat: "https://api.waifu.pics/sfw/pat",
  hug: "https://api.waifu.pics/sfw/hug"
};

module.exports = {
  name: "gif",
  aliases: ["g", "gifwaifu"],
  category: "fun",
  description: "Envoyer un GIF anime selon une catégorie",
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const type = String(args[0] || "anime").toLowerCase();
    const endpoint = TYPES[type];

    if (!endpoint) {
      return sock.sendMessage(jid, {
        text: "🎬 *GIF ANIME*\n\nCatégories : " + Object.keys(TYPES).join(" • ") +
          "\n\nExemple : .gif dance"
      });
    }

    try {
      const response = await axios.get(endpoint, { timeout: 10000 });
      if (!response.data?.url) throw new Error("GIF indisponible");

      return sock.sendMessage(jid, {
        video: { url: response.data.url },
        gifPlayback: true,
        caption: "🎬 *NOXIS-MD • GIF*\n\n✨ Catégorie : " + type
      });
    } catch (error) {
      console.error("GIF command error:", error.message);
      return sock.sendMessage(jid, {
        text: "❌ Impossible d’envoyer ce GIF pour le moment."
      });
    }
  }
};