const axios = require("axios");
const config = require("../../config");

const send = (sock, to, text) => sock.sendMessage(to, { text });

module.exports = [
  {
    name: "screenshot",
    aliases: ["ss", "capture"],
    category: "tools",
    description: "Capture une page web publique",
    async execute(sock, msg, args, ctx) {
      const url = args[0];
      if (!url || !/^https?:\/\//i.test(url)) return send(sock, ctx.sender, `📸 Usage: ${config.prefix}screenshot https://example.com`);
      try {
        const endpoint = "https://image.thum.io/get/width/1280/crop/900/" + encodeURIComponent(url);
        const r = await axios.get(endpoint, { responseType: "arraybuffer", timeout: 30000, maxContentLength: 8 * 1024 * 1024 });
        return sock.sendMessage(ctx.sender, { image: Buffer.from(r.data), caption: "📸 Capture : " + url });
      } catch (e) {
        return send(sock, ctx.sender, "❌ Capture indisponible : " + e.message);
      }
    }
  },
  {
    name: "boost",
    aliases: ["boosttext"],
    category: "tools",
    description: "Met en forme un texte pour le rendre plus visible",
    async execute(sock, msg, args, ctx) {
      const text = args.join(" ").trim();
      if (!text) return send(sock, ctx.sender, `✨ Usage: ${config.prefix}boost ton texte`);
      return send(sock, ctx.sender, "✨ " + text.toUpperCase() + " ✨");
    }
  },
  {
    name: "runtime",
    aliases: ["uptime"],
    category: "tools",
    description: "Affiche le temps de fonctionnement du bot",
    async execute(sock, msg, args, ctx) {
      const s = Math.floor(process.uptime());
      return send(sock, ctx.sender, `⏱️ NOXIS-MD\nUptime : ${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`);
    }
  }
];