const send = (sock, to, text) => sock.sendMessage(to, { text });

const questions = [
  ["Quel est le résultat de 2 + 3 ?", "5"],
  ["Quelle planète est surnommée la planète rouge ?", "Mars"],
  ["Combien de côtés possède un hexagone ?", "6"],
  ["Quelle est la capitale de la France ?", "Paris"],
  ["Quel est le symbole chimique de l'eau ?", "H2O"]
];

module.exports = [
  {
    name: "question",
    aliases: ["questionquiz", "q"],
    category: "education",
    description: "Pose une question éducative",
    async execute(sock, msg, args, ctx) {
      const q = questions[Math.floor(Math.random() * questions.length)];
      return send(sock, ctx.sender, "📚 QUESTION\n\n" + q[0] + "\n\nRéponds avec : " + q[1]);
    }
  },
  {
    name: "define",
    aliases: ["definition", "def"],
    category: "education",
    description: "Explique un mot avec une définition simple",
    async execute(sock, msg, args, ctx) {
      const word = args.join(" ").trim();
      if (!word) return send(sock, ctx.sender, "📖 Utilisation : .define mot");
      try {
        const r = await require("axios").get("https://api.dictionaryapi.dev/api/v2/entries/fr/" + encodeURIComponent(word), { timeout: 10000 });
        const d = r.data?.[0];
        const meaning = d?.meanings?.[0]?.definitions?.[0]?.definition;
        if (!meaning) return send(sock, ctx.sender, "❌ Définition introuvable.");
        return send(sock, ctx.sender, "📖 " + word + "\n\n" + meaning);
      } catch {
        return send(sock, ctx.sender, "❌ Définition introuvable ou service indisponible.");
      }
    }
  },
  {
    name: "convert",
    aliases: ["conversion", "unit"],
    category: "education",
    description: "Conversions courantes",
    async execute(sock, msg, args, ctx) {
      const value = Number(args[0]);
      const unit = String(args[1] || "").toLowerCase();
      if (!Number.isFinite(value) || !unit) return send(sock, ctx.sender, "🔢 Exemples : .convert 10 km ou .convert 2 h");
      const conversions = {
        km: [value, "km", value * 1000, "m"],
        m: [value, "m", value / 1000, "km"],
        h: [value, "h", value * 60, "min"],
        min: [value, "min", value / 60, "h"],
        kg: [value, "kg", value * 1000, "g"],
        g: [value, "g", value / 1000, "kg"]
      };
      const c = conversions[unit];
      if (!c) return send(sock, ctx.sender, "❌ Unités supportées : km, m, h, min, kg, g.");
      return send(sock, ctx.sender, "🔄 " + c[0] + " " + c[1] + " = " + c[2] + " " + c[3]);
    }
  }
];