const send = (sock, to, text) => sock.sendMessage(to, { text });

const pick = (items) => items[Math.floor(Math.random() * items.length)];

module.exports = [
  {
    name: "compliment",
    aliases: ["complimentme", "complimenter"],
    category: "fun",
    description: "Donne un compliment positif",
    async execute(sock, msg, args, ctx) {
      const target = args.join(" ").trim() || "toi";
      return send(sock, ctx.sender, "✨ " + target + " : " + pick([
        "tu apportes une bonne énergie au groupe.",
        "ton imagination est impressionnante.",
        "tu as une vraie personnalité.",
        "tu progresses à chaque étape."
      ]));
    }
  },
  {
    name: "fortune",
    aliases: ["avenir", "destiny"],
    category: "fun",
    description: "Donne une prédiction fictive",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender, "🔮 FORTUNE\n\n" + pick([
        "Une bonne surprise pourrait arriver bientôt.",
        "Une idée simple pourrait devenir un grand projet.",
        "La patience sera ton meilleur allié.",
        "Une nouvelle opportunité pourrait apparaître."
      ]) + "\n\n⚠️ Jeu fictif.");
    }
  },
  {
    name: "mood",
    aliases: ["humeur", "feel"],
    category: "fun",
    description: "Détermine une humeur aléatoire",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender, "🎭 Humeur : " + pick([
        "😎 Chill", "😂 En mode blague", "🔥 Motivé", "🧠 Concentré", "⚡ Énergique", "🌙 Tranquille"
      ]));
    }
  },
  {
    name: "random",
    aliases: ["rand"],
    category: "fun",
    description: "Choisit un nombre aléatoire",
    async execute(sock, msg, args, ctx) {
      let max = Number.parseInt(args[0], 10);
      if (!Number.isFinite(max) || max < 1) max = 100;
      max = Math.min(max, 1000000);
      return send(sock, ctx.sender, "🎲 Nombre aléatoire : " + (Math.floor(Math.random() * max) + 1));
    }
  },
  {
    name: "reverse",
    aliases: ["inverse"],
    category: "fun",
    description: "Inverse un texte",
    async execute(sock, msg, args, ctx) {
      const text = args.join(" ");
      if (!text) return send(sock, ctx.sender, "🔄 Utilisation : .reverse texte");
      return send(sock, ctx.sender, "🔄 " + Array.from(text).reverse().join(""));
    }
  },
  {
    name: "clap",
    aliases: ["emoji"],
    category: "fun",
    description: "Transforme une phrase avec des emojis",
    async execute(sock, msg, args, ctx) {
      const text = args.join(" ");
      if (!text) return send(sock, ctx.sender, "👏 Utilisation : .clap message");
      return send(sock, ctx.sender, "👏 " + text.split(/\s+/).join(" 👏 ") + " 👏");
    }
  }
];