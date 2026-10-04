const axios = require("axios");

const moods = {
  heureux: "happy",
  joyeux: "happy",
  danse: "dance",
  danser: "dance",
  clin: "wink",
  clinoeil: "wink",
  rougir: "blush",
  sourire: "smile",
  salut: "wave",
  coucou: "wave",
  caresse: "pat",
  tapoter: "pat",
  calin: "hug",
  câlin: "hug",
  pleurer: "cry",
  triste: "cry"
};

module.exports = {
  name: "gifmood",
  aliases: ["moodgif", "gifreaction"],
  category: "fun",
  description: "Envoyer un GIF anime selon une humeur",
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const input = args.join(" ").trim().toLowerCase();
    if (!input) {
      return sock.sendMessage(jid, {
        text: "🎭 *GIF MOOD*\n\nUtilisation : .gifmood <humeur>\n\nExemples : heureux, danse, clinoeil, rougir, sourire, salut, caresse, calin, pleurer"
      });
    }

    const category = moods[input];
    if (!category) {
      return sock.sendMessage(jid, {
        text: "❌ Humeur inconnue. Essaie : " + Object.keys(moods).join(" • ")
      });
    }

    try {
      const res = await axios.get("https://api.waifu.pics/sfw/" + category, { timeout: 10000 });
      if (!res.data?.url) throw new Error("GIF indisponible");

      return sock.sendMessage(jid, {
        video: { url: res.data.url },
        gifPlayback: true,
        caption: "🎭 *NOXIS-MD • MOOD GIF*\n✨ Humeur : " + input
      });
    } catch (error) {
      console.error("Mood GIF error:", error.message);
      return sock.sendMessage(jid, { text: "❌ Impossible d’envoyer le GIF pour le moment." });
    }
  }
};