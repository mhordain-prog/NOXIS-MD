const config = require("../../config");

const send = (sock, to, text, extra = {}) => sock.sendMessage(to, { text, ...extra });

function safeCalc(input) {
  const expr = input.replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/");
  if (!expr || !/^[0-9+\-*/%().\s]+$/.test(expr)) return null;
  try {
    const value = Function('"use strict"; return (' + expr + ')')();
    if (!Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

module.exports = [
  {
    name: "calc",
    aliases: ["calculate", "calcul", "math"],
    category: "tools",
    description: "Calculatrice simple",
    async execute(sock, msg, args, ctx) {
      const expression = args.join(" ");
      if (!expression) return send(sock, ctx.sender, `🧮 Usage: ${config.prefix}calc 12*8+5`);
      const result = safeCalc(expression);
      if (result === null) return send(sock, ctx.sender, "❌ Expression invalide.");
      return send(sock, ctx.sender, `🧮 ${expression} = ${result}`);
    }
  },
  {
    name: "dice",
    aliases: ["de", "roll"],
    category: "fun",
    description: "Lance un dé",
    async execute(sock, msg, args, ctx) {
      const sides = Math.max(2, Math.min(100, Number(args[0]) || 6));
      const value = Math.floor(Math.random() * sides) + 1;
      return send(sock, ctx.sender, `🎲 Dé à ${sides} faces: *${value}*`);
    }
  },
  {
    name: "coin",
    aliases: ["pileface", "flip"],
    category: "fun",
    description: "Pile ou face",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender, `🪙 ${Math.random() < 0.5 ? "Pile" : "Face"}`);
    }
  },
  {
    name: "8ball",
    aliases: ["eightball", "fortune"],
    category: "fun",
    description: "Réponse aléatoire",
    async execute(sock, msg, args, ctx) {
      if (!args.length) return send(sock, ctx.sender, `🔮 Usage: ${config.prefix}8ball ta question`);
      const answers = ["Oui.", "Non.", "Probablement.", "Pas maintenant.", "C'est possible.", "Réessaie plus tard."];
      return send(sock, ctx.sender, `🔮 ${answers[Math.floor(Math.random() * answers.length)]}`);
    }
  },
  {
    name: "choose",
    aliases: ["choisir", "choice"],
    category: "tools",
    description: "Choisit une option",
    async execute(sock, msg, args, ctx) {
      const options = args.join(" ").split("|").map(x => x.trim()).filter(Boolean);
      if (options.length < 2) return send(sock, ctx.sender, `🎯 Usage: ${config.prefix}choose rouge | bleu`);
      return send(sock, ctx.sender, `🎯 Je choisis: *${options[Math.floor(Math.random() * options.length)]}*`);
    }
  },
  {
    name: "timestamp",
    aliases: ["time", "heure"],
    category: "tools",
    description: "Heure du serveur",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender, `🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Brazzaville" })}`);
    }
  }
];
