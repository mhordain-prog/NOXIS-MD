const axios = require("axios");

module.exports = {
  name: "gifreply",
  aliases: ["replygif", "gifreponse"],
  category: "fun",
  description: "Répondre à un message avec un GIF anime",
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (!ctx?.stanzaId) {
      return sock.sendMessage(jid, {
        text: "🎯 Réponds d’abord à un message, puis utilise .gifreply"
      });
    }

    const categories = ["happy", "wink", "blush", "smile", "wave", "dance", "pat", "hug"];
    const category = String(args[0] || categories[Math.floor(Math.random() * categories.length)]).toLowerCase();
    if (!categories.includes(category)) {
      return sock.sendMessage(jid, {
        text: "🎬 Catégories : " + categories.join(" • ")
      });
    }

    try {
      const res = await axios.get("https://api.waifu.pics/sfw/" + category, { timeout: 10000 });
      if (!res.data?.url) throw new Error("GIF indisponible");

      return sock.sendMessage(jid, {
        video: { url: res.data.url },
        gifPlayback: true,
        caption: "🎬 *NOXIS-MD • GIF REPLY*\n✨ Réponse anime : " + category,
        quoted: msg
      });
    } catch (error) {
      console.error("GIF reply error:", error.message);
      return sock.sendMessage(jid, { text: "❌ GIF indisponible pour le moment." });
    }
  }
};