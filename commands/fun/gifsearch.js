const axios = require("axios");

const ENDPOINTS = {
  random: "https://api.waifu.pics/sfw/waifu",
  neko: "https://api.waifu.pics/sfw/neko",
  kitsune: "https://api.waifu.pics/sfw/waifu",
  anime: "https://api.waifu.pics/sfw/waifu"
};

module.exports = {
  name: "gifsearch",
  aliases: ["searchgif", "findgif"],
  category: "fun",
  description: "Rechercher un GIF anime par mot-clé",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const query = args.join(" ").trim().toLowerCase();

    if (!query) {
      return sock.sendMessage(jid, {
        text:
          "🔎 *GIF ANIME*\n\n" +
          "Utilisation : .gifsearch <mot-clé>\n" +
          "Exemple : .gifsearch Naruto\n\n" +
          "ℹ️ Le service retourne un GIF anime disponible correspondant au type demandé."
      });
    }

    const endpoint = ENDPOINTS[query] || ENDPOINTS.random;

    try {
      const response = await axios.get(endpoint, { timeout: 10000 });
      if (!response.data?.url) throw new Error("GIF introuvable");

      return sock.sendMessage(jid, {
        video: { url: response.data.url },
        gifPlayback: true,
        caption:
          "🔎 *NOXIS-MD • GIF ANIME*\n\n" +
          "🎭 Recherche : " + query + "\n" +
          "✨ GIF animé !"
      });
    } catch (error) {
      console.error("GIF search error:", error.message);
      return sock.sendMessage(jid, {
        text: "❌ Aucun GIF disponible pour cette recherche pour le moment."
      });
    }
  }
};
