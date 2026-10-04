const fs = require("fs-extra");
const path = require("path");

const file = path.join(__dirname, "../../data/noxis-bank.json");
const send = (sock, to, text) => sock.sendMessage(to, { text });

function load() {
  try { return fs.readJsonSync(file); } catch { return {}; }
}
async function save(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}
function account(data, id) {
  if (!data[id]) data[id] = { balance: 0, updated: Date.now() };
  return data[id];
}

module.exports = [
  {
    name: "bankbalance",
    aliases: ["banksaldo", "bankbal"],
    category: "bank",
    description: "Affiche le solde bancaire virtuel",
    async execute(sock, msg, args, ctx) {
      const data = load();
      const a = account(data, ctx.sender);
      await save(data);
      return send(sock, ctx.sender, "🏦 Solde bancaire : " + a.balance + " NOX");
    }
  },
  {
    name: "deposit",
    aliases: ["depot"],
    category: "bank",
    description: "Dépose des NOX dans la banque virtuelle",
    async execute(sock, msg, args, ctx) {
      const amount = Number.parseInt(args[0], 10);
      if (!Number.isFinite(amount) || amount < 1) return send(sock, ctx.sender, "🏦 Utilisation : .deposit 100");
      const economyFile = path.join(__dirname, "../../data/noxis-economy.json");
      let economy = {};
      try { economy = fs.readJsonSync(economyFile); } catch {}
      const wallet = economy[ctx.sender] || { coins: 0, lastDaily: 0 };
      if (wallet.coins < amount) return send(sock, ctx.sender, "❌ Solde NOX insuffisant.");
      const data = load();
      const a = account(data, ctx.sender);
      wallet.coins -= amount;
      a.balance += amount;
      a.updated = Date.now();
      economy[ctx.sender] = wallet;
      await fs.ensureFile(economyFile);
      await fs.writeJson(economyFile, economy, { spaces: 2 });
      await save(data);
      return send(sock, ctx.sender, "🏦 Dépôt effectué : " + amount + " NOX.");
    }
  },
  {
    name: "withdraw",
    aliases: ["retrait"],
    category: "bank",
    description: "Retire des NOX de la banque virtuelle",
    async execute(sock, msg, args, ctx) {
      const amount = Number.parseInt(args[0], 10);
      if (!Number.isFinite(amount) || amount < 1) return send(sock, ctx.sender, "🏦 Utilisation : .withdraw 100");
      const data = load();
      const a = account(data, ctx.sender);
      if (a.balance < amount) return send(sock, ctx.sender, "❌ Solde bancaire insuffisant.");
      const economyFile = path.join(__dirname, "../../data/noxis-economy.json");
      let economy = {};
      try { economy = fs.readJsonSync(economyFile); } catch {}
      const wallet = economy[ctx.sender] || { coins: 0, lastDaily: 0 };
      wallet.coins += amount;
      a.balance -= amount;
      a.updated = Date.now();
      economy[ctx.sender] = wallet;
      await fs.ensureFile(economyFile);
      await fs.writeJson(economyFile, economy, { spaces: 2 });
      await save(data);
      return send(sock, ctx.sender, "🏦 Retrait effectué : " + amount + " NOX.");
    }
  }
];