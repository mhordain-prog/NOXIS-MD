const axios = require("axios");

const scenes = {
  celebrate: "happy",
  celebration: "happy",
  victory: "happy",
  laugh: "happy",
  laughing: "happy",
  surprise: "blush",
  greeting: "wave",
  welcome: "wave",
  friendship: "hug",
  support: "pat",
  dance: "dance",
  sleep: "sleepy",
  sad: "cry",
  reaction: "smile"
};

module.exports = {
  name: "gifscene",
  aliases: ["scene", "animeaction"],
  category: "fun",
  description: "Envoyer un GIF anime pour une scène fun",
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const key = args.join(" ").trim().toLowerCase();

    if (!key || !scenes[key]) {
      return sock.sendMessage(jid, {
        text:
          "🎬 *GIF SCÈNE ANIME*\n\n" +
          "Choix : " + Object.keys(scenes).join(" • ") +
          "\n\nExemple : .gifscene celebration"
      });
    }

    try {
      const res = await axios.get("https://api.waifu.pics/sfw/" + scenes[key], { timeout: 10000 });
      if (!res.data?.url) throw new Error("GIF indisponible");

      return sock.sendMessage(jid, {
        video: { url: res.data.url },
        gifPlayback: true,
        caption: "🎬 *NOXIS-MD • SCÈNE ANIME*\n✨ " + key
      });
    } catch (error) {
      console.error("GIF scene error:", error.message);
      return sock.sendMessage(jid, {
        text: "❌ GIF indisponible pour le moment."
      });
    }
  }
};