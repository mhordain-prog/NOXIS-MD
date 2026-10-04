const fs = require("fs-extra");
const path = require("path");

const file = path.join(__dirname, "../../data/profiles.json");
const send = (sock, to, text) => sock.sendMessage(to, { text });

function load() {
  try { return fs.readJsonSync(file); } catch { return {}; }
}

async function save(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}

function target(msg, ctx) {
  return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.sender;
}

module.exports = [
  {
    name: "setbio",
    aliases: ["bio", "aboutme"],
    category: "profile",
    description: "Définit une bio locale",
    async execute(sock, msg, args, ctx) {
      const bio = args.join(" ").trim();
      if (!bio) return send(sock, ctx.sender, "👤 Utilisation : .setbio ta bio");
      if (bio.length > 160) return send(sock, ctx.sender, "❌ Bio limitée à 160 caractères.");
      const data = load();
      data[ctx.sender] = { ...(data[ctx.sender] || {}), bio };
      await save(data);
      return send(sock, ctx.sender, "✅ Bio enregistrée.");
    }
  },
  {
    name: "getbio",
    aliases: ["mybio"],
    category: "profile",
    description: "Affiche une bio locale",
    async execute(sock, msg, args, ctx) {
      const id = target(msg, ctx);
      const data = load();
      const bio = data[id]?.bio || "Aucune bio enregistrée.";
      return send(sock, ctx.sender, "👤 Bio : " + bio, { mentions: id !== ctx.sender ? [id] : [] });
    }
  },
  {
    name: "userinfo",
    aliases: ["user", "whois"],
    category: "profile",
    description: "Affiche les informations publiques du profil",
    async execute(sock, msg, args, ctx) {
      const id = target(msg, ctx);
      const name = msg.pushName || "Utilisateur";
      return send(sock, ctx.sender,
        "👤 USER INFO\n" +
        "• Nom : " + name +
        "\n• JID : " + id +
        "\n• Contexte : " + (ctx.isGroup ? "Groupe" : "Privé"),
        { mentions: id !== ctx.sender ? [id] : [] }
      );
    }
  }
];