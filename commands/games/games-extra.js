const fs = require("fs-extra");
const path = require("path");

const file = path.join(__dirname, "../../data/games.json");
const send = (sock, to, text) => sock.sendMessage(to, { text });

function load() {
  try { return fs.readJsonSync(file); } catch { return {}; }
}
async function save(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}

module.exports = [
  {
    name: "guess",
    aliases: ["devine", "numbergame"],
    category: "games",
    description: "Devine un nombre entre 1 et 100",
    async execute(sock, msg, args, ctx) {
      const data = load();
      if (args[0] === "new" || !data[ctx.sender]) {
        data[ctx.sender] = { target: Math.floor(Math.random() * 100) + 1, attempts: 0 };
        await save(data);
        return send(sock, ctx.sender, "🎯 Nouveau jeu !\nJ'ai choisi un nombre entre 1 et 100.\nUtilise .guess 50");
      }
      const n = Number.parseInt(args[0], 10);
      if (!Number.isInteger(n) || n < 1 || n > 100) return send(sock, ctx.sender, "🎯 Choisis un nombre entre 1 et 100.");
      const game = data[ctx.sender];
      game.attempts++;
      if (n === game.target) {
        const attempts = game.attempts;
        delete data[ctx.sender];
        await save(data);
        return send(sock, ctx.sender, "🎉 Bravo ! Tu as trouvé en " + attempts + " tentative(s).");
      }
      await save(data);
      return send(sock, ctx.sender, n < game.target ? "⬆️ Plus grand !" : "⬇️ Plus petit !");
    }
  },
  {
    name: "rpsgame",
    aliases: ["rpsplay", "chifoumi2"],
    category: "games",
    description: "Pierre-papier-ciseaux",
    async execute(sock, msg, args, ctx) {
      const choices = ["pierre", "papier", "ciseaux"];
      const user = String(args[0] || "").toLowerCase();
      if (!choices.includes(user)) return send(sock, ctx.sender, "✊ Utilisation : .rpsgame pierre|papier|ciseaux");
      const bot = choices[Math.floor(Math.random() * choices.length)];
      const win = (user === "pierre" && bot === "ciseaux") || (user === "papier" && bot === "pierre") || (user === "ciseaux" && bot === "papier");
      const result = user === bot ? "🤝 Égalité !" : win ? "🏆 Tu as gagné !" : "🤖 J'ai gagné !";
      return send(sock, ctx.sender, "✊ Toi : " + user + "\n🤖 NOXIS : " + bot + "\n\n" + result);
    }
  },
  {
    name: "higherlower",
    aliases: ["plusmoins"],
    category: "games",
    description: "Jeu plus haut ou plus bas",
    async execute(sock, msg, args, ctx) {
      const a = Math.floor(Math.random() * 50) + 1;
      const b = Math.floor(Math.random() * 50) + 1;
      const op = String(args[0] || "").toLowerCase();
      if (!["higher", "lower", "haut", "bas"].includes(op)) return send(sock, ctx.sender, "🎲 Utilisation : .higherlower haut|bas");
      const answer = a === b ? "equal" : a > b ? "higher" : "lower";
      const user = op === "haut" || op === "higher" ? "higher" : "lower";
      return send(sock, ctx.sender, "🎲 " + a + " contre " + b + "\n" + (answer === user ? "✅ Bonne réponse !" : answer === "equal" ? "🤝 Égalité." : "❌ Mauvaise réponse."));
    }
  }
];