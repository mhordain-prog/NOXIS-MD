const fs = require("fs-extra");
const path = require("path");

const file = path.join(__dirname, "../../data/noxis-economy.json");
const send = (sock, to, text) => sock.sendMessage(to, { text });

function load() {
  try { return fs.readJsonSync(file); } catch { return {}; }
}
async function save(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}
function account(data, id) {
  if (!data[id]) data[id] = { coins: 0, lastDaily: 0 };
  return data[id];
}

module.exports = [
  {
    name: "balance",
    aliases: ["bal", "coins"],
    category: "economy",
    description: "Affiche le solde virtuel",
    async execute(sock, msg, args, ctx) {
      const data = load();
      const a = account(data, ctx.sender);
      await save(data);
      return send(sock, ctx.sender, "💰 Solde : " + a.coins + " NOX");
    }
  },
  {
    name: "daily",
    aliases: ["bonus", "reward"],
    category: "economy",
    description: "Récompense quotidienne virtuelle",
    async execute(sock, msg, args, ctx) {
      const data = load();
      const a = account(data, ctx.sender);
      const now = Date.now();
      const day = 86400000;
      if (now - a.lastDaily < day) {
        const remaining = day - (now - a.lastDaily);
        return send(sock, ctx.sender, "⏳ Bonus déjà récupéré. Réessaie dans " + Math.ceil(remaining / 3600000) + " h.");
      }
      a.coins += 100;
      a.lastDaily = now;
      await save(data);
      return send(sock, ctx.sender, "🎁 +100 NOX ! Nouveau solde : " + a.coins);
    }
  },
  {
    name: "give",
    aliases: ["pay", "transfer"],
    category: "economy",
    description: "Transfère des pièces virtuelles",
    async execute(sock, msg, args, ctx) {
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amount = Number.parseInt(args.find(x => /^\d+$/.test(x)), 10);
      if (!target || !Number.isFinite(amount) || amount < 1) return send(sock, ctx.sender, "💸 Utilisation : .give @membre 100");
      const data = load();
      const from = account(data, ctx.sender);
      const to = account(data, target);
      if (from.coins < amount) return send(sock, ctx.sender, "❌ Solde insuffisant.");
      from.coins -= amount;
      to.coins += amount;
      await save(data);
      return send(sock, ctx.sender, "💸 Transfert effectué : " + amount + " NOX.", { mentions: [target] });
    }
  }
];

module.exports = module.exports;