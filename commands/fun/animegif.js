const axios = require("axios");

const CATEGORIES = [
  "waifu", "neko", "shinobu", "megumin", "happy", "dance",
  "wink", "blush", "cry", "smile", "wave", "pat", "hug"
];

module.exports = {
  name: "animegif",
  aliases: ["gifanime", "randomgif", "agif"],
  category: "fun",
  description: "Envoyer un GIF anime aléatoire",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const requested = String(args[0] || "").toLowerCase();
    const category = CATEGORIES.includes(requested)
      ? requested
      : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    try {
      const response = await axios.get("https://api.waifu.pics/sfw/" + category, {
        timeout: 10000
      });

      if (!response.data?.url) throw new Error("GIF introuvable");

      return sock.sendMessage(jid, {
        video: { url: response.data.url },
        gifPlayback: true,
        caption:
          "🎬 *NOXIS-MD • ANIME GIF*\n\n" +
          "🎭 Catégorie : " + category + "\n" +
          "✨ GIF anime aléatoire !"
      });
    } catch (error) {
      console.error("Anime GIF random error:", error.message);
      return sock.sendMessage(jid, {
        text: "❌ Impossible de récupérer un GIF anime pour le moment."
      });
    }
  }
};
