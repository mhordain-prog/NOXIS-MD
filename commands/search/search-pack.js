const axios = require("axios");
const config = require("../../config");

const send = (sock, to, text) => sock.sendMessage(to, { text });

module.exports = [
  {
    name: "wiki",
    aliases: ["wikipedia", "w"],
    category: "search",
    description: "Recherche sur Wikipédia",
    async execute(sock, msg, args, ctx) {
      const query = args.join(" ");
      if (!query) return send(sock, ctx.sender, `🔎 Usage: ${config.prefix}wiki sujet`);
      try {
        const r = await axios.get("https://fr.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(query), { timeout: 10000 });
        const d = r.data;
        if (!d?.extract) return send(sock, ctx.sender, "❌ Aucun résultat trouvé.");
        const title = d.title || query;
        const extract = d.extract.length > 2500 ? d.extract.slice(0, 2500) + "…" : d.extract;
        return send(sock, ctx.sender, `📚 ${title}\n\n${extract}\n\n🔗 ${d.content_urls?.desktop?.page || ""}`);
      } catch {
        return send(sock, ctx.sender, "❌ Recherche Wikipédia indisponible ou résultat introuvable.");
      }
    }
  },
  {
    name: "define",
    aliases: ["definition", "def"],
    category: "search",
    description: "Cherche une définition publique",
    async execute(sock, msg, args, ctx) {
      const word = args.join(" ");
      if (!word) return send(sock, ctx.sender, `📖 Usage: ${config.prefix}define mot`);
      try {
        const r = await axios.get("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(word), { timeout: 10000 });
        const entry = r.data?.[0];
        const meaning = entry?.meanings?.[0]?.definitions?.[0]?.definition;
        if (!meaning) return send(sock, ctx.sender, "❌ Définition introuvable.");
        return send(sock, ctx.sender, `📖 ${entry.word}\n${meaning}`);
      } catch {
        return send(sock, ctx.sender, "❌ Définition indisponible.");
      }
    }
  }
];
