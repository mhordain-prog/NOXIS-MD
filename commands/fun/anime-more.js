const axios = require("axios");

const ACTIONS = {
  cry: ["😢", "Pleurer"],
  blush: ["😊", "Rougir"],
  angry: ["😤", "Être énervé"],
  confused: ["🤔", "Être confus"],
  happy: ["😄", "Être heureux"],
  sad: ["🥲", "Être triste"],
  sleepy: ["😴", "Somnoler"],
  thinking: ["🤔", "Réfléchir"],
  tired: ["🥱", "Être fatigué"],
  nervous: ["😰", "Être nerveux"],
  nom: ["🍜", "Manger"],
  cuddle: ["🫂", "Faire un câlin amical"],
  glomp: ["🫂", "Faire un gros câlin amical"],
  handhold: ["🤝", "Tenir la main"],
  bite: ["😼", "Mordiller façon cartoon"],
  cringe: ["😬", "Réagir à quelque chose de gênant"],
  smug: ["😏", "Prendre un air satisfait"],
  owo: ["😳", "Réagir façon anime"],
  nervous: ["😰", "Être nerveux"],
  shinobu: ["🦋", "Réaction anime"],
  megumin: ["💥", "Réaction anime spectaculaire"],
  senpai: ["✨", "Réaction anime"],
  shinobu: ["🦋", "Réaction anime"],
  wave: ["👋", "Saluer"],
  dance: ["💃", "Danser"],
  highfive: ["🙌", "Faire un high-five"],
  smile: ["😊", "Sourire"],
  wink: ["😉", "Faire un clin d’œil"],
  poke: ["👉", "Taquiner"],
  pat: ["🫳", "Tapoter amicalement"],
  hug: ["🤗", "Faire un câlin amical"],
  kick: ["🦵", "Faire un coup de pied cartoon"],
  slap: ["👋", "Faire une gifle cartoon"],
  bonk: ["🔨", "Faire un bonk cartoon"],
  yeet: ["🚀", "Éloigner façon cartoon"]
};

function targetFromMessage(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  return ctx?.mentionedJid?.[0] || ctx?.participant || null;
}

function number(jid) {
  return "@" + jid.split("@")[0];
}

async function gif(endpoint) {
  const res = await axios.get("https://api.waifu.pics/sfw/" + endpoint, { timeout: 10000 });
  if (!res.data?.url) throw new Error("GIF introuvable");
  return res.data.url;
}

module.exports = Object.entries(ACTIONS).map(([name, info]) => ({
  name,
  aliases: [],
  category: "fun",
  description: "GIF anime : " + info[1],
  async execute(sock, msg) {
    const jid = msg.key.remoteJid;
    const target = targetFromMessage(msg);

    if (!target) {
      return sock.sendMessage(jid, {
        text: "🎯 Mentionne quelqu’un ou réponds à son message.\nExemple : ." + name + " @membre"
      });
    }

    try {
      const url = await gif(name);
      return sock.sendMessage(jid, {
        video: { url },
        gifPlayback: true,
        caption:
          "🎬 *NOXIS-MD • ANIME GIF*\n\n" +
          info[0] + " " + info[1] + " → " + number(target) +
          "\n\n😂 Interaction fun / cartoon !",
        mentions: [target]
      });
    } catch (error) {
      console.error("GIF anime error:", error.message);
      return sock.sendMessage(jid, {
        text: "❌ GIF indisponible pour le moment. Réessaie plus tard."
      });
    }
  }
}));
