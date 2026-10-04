const axios = require("axios");
const config = require("../../config");

const send = (sock, to, text) => sock.sendMessage(to, { text });

module.exports = [
  {
    name: "short",
    aliases: ["shorturl", "url"],
    category: "tools",
    description: "Raccourcit une URL publique",
    async execute(sock, msg, args, ctx) {
      const url = args[0];
      if (!url || !/^https?:\/\//i.test(url)) return send(sock, ctx.sender, `🔗 Usage: ${config.prefix}short https://exemple.com`);
      try {
        const r = await axios.get("https://is.gd/create.php", { params: { format: "simple", url }, timeout: 10000 });
        return send(sock, ctx.sender, "🔗 " + String(r.data).trim());
      } catch {
        return send(sock, ctx.sender, "❌ Impossible de raccourcir cette URL.");
      }
    }
  },
  {
    name: "headers",
    aliases: ["urlinfo"],
    category: "tools",
    description: "Vérifie une URL publique",
    async execute(sock, msg, args, ctx) {
      const url = args[0];
      if (!url || !/^https?:\/\//i.test(url)) return send(sock, ctx.sender, `🌐 Usage: ${config.prefix}headers https://exemple.com`);
      try {
        const r = await axios.head(url, { timeout: 10000, maxRedirects: 3, validateStatus: () => true });
        return send(sock, ctx.sender, `🌐 URL: ${url}\n📡 HTTP: ${r.status}\n📦 Type: ${r.headers["content-type"] || "inconnu"}`);
      } catch {
        return send(sock, ctx.sender, "❌ URL inaccessible ou délai dépassé.");
      }
    }
  }
];
