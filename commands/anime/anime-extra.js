const axios = require("axios");

async function send(sock, to, text) {
  return sock.sendMessage(to, { text });
}

async function jikan(path, params = {}) {
  const r = await axios.get("https://api.jikan.moe/v4/" + path, {
    params,
    timeout: 15000
  });
  return r.data?.data || [];
}

module.exports = [
  {
    name: "waifu",
    aliases: ["animegirl"],
    category: "anime",
    description: "Trouve un personnage féminin d'anime",
    async execute(sock, msg, args, ctx) {
      try {
        const data = await jikan("characters", { q: args.join(" ") || "anime", limit: 5 });
        if (!data.length) return send(sock, ctx.sender, "❌ Aucun personnage trouvé.");
        const c = data[0];
        return send(sock, ctx.sender, "🌸 WAIFU

" + c.name + "
🔗 " + (c.url || "N/A"));
      } catch {
        return send(sock, ctx.sender, "❌ Service anime indisponible.");
      }
    }
  },
  {
    name: "animeinfo",
    aliases: ["animeinfo", "animedetail"],
    category: "anime",
    description: "Affiche les informations d'un anime",
    async execute(sock, msg, args, ctx) {
      const q = args.join(" ").trim();
      if (!q) return send(sock, ctx.sender, "🎭 Utilisation : .animeinfo nom");
      try {
        const data = await jikan("anime", { q, limit: 1 });
        const a = data[0];
        if (!a) return send(sock, ctx.sender, "❌ Anime introuvable.");
        return send(sock, ctx.sender,
          "🎭 " + a.title +
          "
⭐ Score : " + (a.score ?? "N/A") +
          "
📺 Épisodes : " + (a.episodes ?? "N/A") +
          "
📅 Statut : " + (a.status || "N/A") +
          "
📖 " + (a.synopsis || "Pas de synopsis.").slice(0, 700)
        );
      } catch {
        return send(sock, ctx.sender, "❌ Recherche anime indisponible.");
      }
    }
  },
  {
    name: "character",
    aliases: ["animechar"],
    category: "anime",
    description: "Recherche un personnage d'anime",
    async execute(sock, msg, args, ctx) {
      const q = args.join(" ").trim();
      if (!q) return send(sock, ctx.sender, "🧑‍🎤 Utilisation : .character nom");
      try {
        const data = await jikan("characters", { q, limit: 3 });
        if (!data.length) return send(sock, ctx.sender, "❌ Personnage introuvable.");
        return send(sock, ctx.sender, "🧑‍🎤 PERSONNAGES

" +
          data.map((c, i) => (i + 1) + ". " + c.name + "
🔗 " + (c.url || "N/A")).join("

"));
      } catch {
        return send(sock, ctx.sender, "❌ Recherche personnage indisponible.");
      }
    }
  },
  {
    name: "manga",
    aliases: ["mangasearch"],
    category: "anime",
    description: "Recherche un manga",
    async execute(sock, msg, args, ctx) {
      const q = args.join(" ").trim();
      if (!q) return send(sock, ctx.sender, "📚 Utilisation : .manga nom");
      try {
        const data = await jikan("manga", { q, limit: 5 });
        if (!data.length) return send(sock, ctx.sender, "❌ Manga introuvable.");
        return send(sock, ctx.sender, "📚 MANGA

" +
          data.map((m, i) => (i + 1) + ". " + m.title + "
⭐ " + (m.score ?? "N/A")).join("

"));
      } catch {
        return send(sock, ctx.sender, "❌ Recherche manga indisponible.");
      }
    }
  }
];

module.exports = module.exports;