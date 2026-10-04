const fs = require("fs-extra");
const path = require("path");

const file = path.join(__dirname, "../../data/warnings.json");
const send = (sock, to, text, extra = {}) => sock.sendMessage(to, { text, ...extra });

function targets(msg, args) {
  const c = msg.message?.extendedTextMessage?.contextInfo;
  if (c?.mentionedJid?.length) return c.mentionedJid;
  return args.filter(x => /^\d{6,20}$/.test(x)).map(x => x + "@s.whatsapp.net");
}

function read() {
  try {
    return fs.readJsonSync(file);
  } catch {
    return {};
  }
}

async function write(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}

function admin(meta, jid) {
  return !!meta.participants.find(p => p.id === jid)?.admin;
}

async function guard(sock, ctx) {
  if (!ctx.isGroup) {
    await send(sock, ctx.sender, "❌ Groupe uniquement.");
    return null;
  }
  const meta = await sock.groupMetadata(ctx.sender);
  if (!admin(meta, ctx.sender)) {
    await send(sock, ctx.sender, "❌ Réservé aux administrateurs.");
    return null;
  }
  return meta;
}

module.exports = [
  {
    name: "warn",
    aliases: ["avertir"],
    category: "security",
    description: "Enregistre un avertissement pour un membre",
    async execute(sock, msg, args, ctx) {
      const meta = await guard(sock, ctx);
      if (!meta) return;
      const ids = targets(msg, args);
      if (!ids.length) return send(sock, ctx.sender, "⚠️ Mentionne le membre.");
      const data = read();
      if (!data[ctx.sender]) data[ctx.sender] = {};
      for (const id of ids) data[ctx.sender][id] = (data[ctx.sender][id] || 0) + 1;
      await write(data);
      return send(sock, ctx.sender, "⚠️ Avertissement(s) ajouté(s).", { mentions: ids });
    }
  },
  {
    name: "warnings",
    aliases: ["warns", "avertissements"],
    category: "security",
    description: "Affiche les avertissements d'un membre",
    async execute(sock, msg, args, ctx) {
      if (!ctx.isGroup) return send(sock, ctx.sender, "❌ Groupe uniquement.");
      const ids = targets(msg, args);
      const id = ids[0] || ctx.sender;
      const data = read();
      const count = data[ctx.sender]?.[id] || 0;
      return send(sock, ctx.sender, "⚠️ Avertissements : " + count, { mentions: [id] });
    }
  },
  {
    name: "clearwarn",
    aliases: ["clearwarnings", "resetwarn"],
    category: "security",
    description: "Réinitialise les avertissements d'un membre",
    async execute(sock, msg, args, ctx) {
      const meta = await guard(sock, ctx);
      if (!meta) return;
      const ids = targets(msg, args);
      if (!ids.length) return send(sock, ctx.sender, "⚠️ Mentionne le membre.");
      const data = read();
      if (data[ctx.sender]) {
        for (const id of ids) delete data[ctx.sender][id];
        await write(data);
      }
      return send(sock, ctx.sender, "✅ Avertissements réinitialisés.", { mentions: ids });
    }
  }
];