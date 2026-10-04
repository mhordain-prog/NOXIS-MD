const axios = require("axios");

const ACTIONS = {
  slap:  { label: "👋 GIF anime de gifle", endpoint: "slap" },
  kick:  { label: "🦵 GIF anime de coup de pied", endpoint: "kick" },
  bonk:  { label: "🔨 GIF anime de bonk", endpoint: "bonk" },
  yeet:  { label: "🚀 GIF anime pour éloigner quelqu’un", endpoint: "yeet" },
  pat:   { label: "🫳 GIF anime pour caresser/tapoter", endpoint: "pat" },
  hug:   { label: "🤗 GIF anime pour faire un câlin", endpoint: "hug" },
  poke:  { label: "👉 GIF anime pour taquiner", endpoint: "poke" },
  highfive: { label: "🙌 GIF anime high-five", endpoint: "highfive" },
  wave:  { label: "👋 GIF anime pour saluer", endpoint: "wave" },
  wink:  { label: "😉 GIF anime clin d’œil", endpoint: "wink" },
  dance: { label: "💃 GIF anime pour danser", endpoint: "dance" },
  smile: { label: "😊 GIF anime sourire", endpoint: "smile" }
};

function getTarget(msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  return mentioned || quoted || null;
}

function display(jid) {
  return jid ? "@" + jid.split("@")[0] : "quelqu’un";
}

async function getGif(endpoint) {
  const response = await axios.get("https://api.waifu.pics/sfw/" + endpoint, {
    timeout: 10000
  });
  if (!response.data?.url) throw new Error("GIF indisponible");
  return response.data.url;
}

function makeCommand(name, action) {
  return {
    name,
    aliases: [],
    category: "fun",
    description: action.label,
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;
      const target = getTarget(msg);

      if (!target) {
        return sock.sendMessage(jid, {
          text: "🎯 Mentionne quelqu’un ou réponds à son message.\nExemple : ." + name + " @quelquun"
        });
      }

      try {
        const gifUrl = await getGif(action.endpoint);
        const caption =
          "🎭 *NOXIS-MD FUN*\n\n" +
          action.label + "\n" +
          "🎯 Cible : " + display(target) + "\n\n" +
          "😂 C’est juste pour rigoler !";

        return sock.sendMessage(jid, {
          video: { url: gifUrl },
          gifPlayback: true,
          caption,
          mentions: [target]
        });
      } catch (error) {
        console.error("Anime GIF error:", error.message);
        return sock.sendMessage(jid, {
          text: "❌ Impossible de récupérer le GIF pour le moment. Réessaie plus tard."
        });
      }
    }
  };
}

module.exports = Object.entries(ACTIONS).map(([name, action]) => makeCommand(name, action));
