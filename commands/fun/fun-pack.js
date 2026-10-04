const send = (sock, to, text, extra = {}) => sock.sendMessage(to, { text, ...extra });

module.exports = [
  {
    name: "love",
    aliases: ["amour"],
    category: "fun",
    description: "Message amusant",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender, "💫 NOXIS-MD: garde ton énergie pour les bonnes personnes. 😄");
    }
  },
  {
    name: "quote",
    aliases: ["citation"],
    category: "fun",
    description: "Citation originale",
    async execute(sock, msg, args, ctx) {
      const quotes = [
        "⚡ La constance transforme les petites actions en grands résultats.",
        "🧠 Comprendre vaut mieux que simplement mémoriser.",
        "🚀 Commence petit, améliore chaque jour."
      ];
      return send(sock, ctx.sender, quotes[Math.floor(Math.random() * quotes.length)]);
    }
  },
  {
    name: "rps",
    aliases: ["shifumi", "pfc"],
    category: "fun",
    description: "Pierre papier ciseaux",
    async execute(sock, msg, args, ctx) {
      const choices = ["pierre", "papier", "ciseaux"];
      const user = String(args[0] || "").toLowerCase();
      if (!choices.includes(user)) return send(sock, ctx.sender, "🎮 Usage: .rps pierre|papier|ciseaux");
      const bot = choices[Math.floor(Math.random() * choices.length)];
      const win = (user === "pierre" && bot === "ciseaux") || (user === "papier" && bot === "pierre") || (user === "ciseaux" && bot === "papier");
      const result = user === bot ? "Égalité" : win ? "Tu gagnes !" : "NOXIS gagne !";
      return send(sock, ctx.sender, `🎮 Toi: ${user}\n🤖 NOXIS: ${bot}\n🏆 ${result}`);
    }
  }
];
