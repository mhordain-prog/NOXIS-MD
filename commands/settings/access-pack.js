const fs = require("fs-extra");
const path = require("path");
const file = path.join(__dirname, "../../data/access.json");

function load() {
  try {
    const data = fs.readJsonSync(file);
    return {
      sudo: Array.isArray(data.sudo) ? data.sudo : [],
      ban: Array.isArray(data.ban) ? data.ban : []
    };
  } catch {
    return { sudo: [], ban: [] };
  }
}

async function save(data) {
  await fs.ensureFile(file);
  await fs.writeJson(file, data, { spaces: 2 });
}

function digits(value) {
  return String(value || "").split(":")[0].replace(/\D/g, "");
}

function jidFrom(args, msg) {
  const context = msg.message?.extendedTextMessage?.contextInfo;
  if (context?.mentionedJid?.[0]) return context.mentionedJid[0];

  const number = String(args[0] || "").replace(/\D/g, "");
  return number.length >= 6 ? number + "@s.whatsapp.net" : null;
}

async function owner(sock, ctx) {
  const permissionMiddleware = require("../../lib/permissionMiddleware");
  const senderNumber = digits(ctx.senderNumber);

  if (!permissionMiddleware.isOwnerOrSudo(senderNumber)) {
    await sock.sendMessage(ctx.sender, { text: "❌ Réservé au propriétaire." });
    return false;
  }

  return true;
}

module.exports = [
  {
    name: "sudo",
    category: "settings",
    description: "Ajoute un sudo",
    async execute(sock, msg, args, ctx) {
      if (!await owner(sock, ctx)) return;
      const jid = jidFrom(args, msg);
      if (!jid) return sock.sendMessage(ctx.sender, { text: "❌ Mentionne un membre." });

      const data = load();
      if (!data.sudo.some(item => digits(item) === digits(jid))) data.sudo.push(jid);
      await save(data);
      return sock.sendMessage(ctx.sender, { text: "👑 Sudo ajouté.", mentions: [jid] });
    }
  },
  {
    name: "delsudo",
    aliases: ["unsudo"],
    category: "settings",
    description: "Retire un sudo",
    async execute(sock, msg, args, ctx) {
      if (!await owner(sock, ctx)) return;
      const jid = jidFrom(args, msg);
      if (!jid) return sock.sendMessage(ctx.sender, { text: "❌ Mentionne un membre." });

      const data = load();
      data.sudo = data.sudo.filter(item => digits(item) !== digits(jid));
      await save(data);
      return sock.sendMessage(ctx.sender, { text: "🗑️ Sudo retiré.", mentions: [jid] });
    }
  },
  {
    name: "listsudo",
    category: "settings",
    description: "Liste les sudo",
    async execute(sock, msg, args, ctx) {
      const data = load();
      if (!data.sudo.length) return sock.sendMessage(ctx.sender, { text: "👑 Aucun sudo." });

      return sock.sendMessage(ctx.sender, {
        text: "👑 SUDO\n\n" + data.sudo.map(item => "• @" + item.split("@")[0]).join("\n"),
        mentions: data.sudo
      });
    }
  },
  {
    name: "ban",
    category: "settings",
    description: "Bloque un utilisateur du bot",
    async execute(sock, msg, args, ctx) {
      if (!await owner(sock, ctx)) return;
      const jid = jidFrom(args, msg);
      if (!jid) return sock.sendMessage(ctx.sender, { text: "❌ Mentionne un membre." });

      const data = load();
      if (!data.ban.some(item => digits(item) === digits(jid))) data.ban.push(jid);
      await save(data);
      return sock.sendMessage(ctx.sender, { text: "🚫 Utilisateur banni du bot.", mentions: [jid] });
    }
  },
  {
    name: "unban",
    category: "settings",
    description: "Débannit un utilisateur",
    async execute(sock, msg, args, ctx) {
      if (!await owner(sock, ctx)) return;
      const jid = jidFrom(args, msg);
      if (!jid) return sock.sendMessage(ctx.sender, { text: "❌ Mentionne un membre." });

      const data = load();
      data.ban = data.ban.filter(item => digits(item) !== digits(jid));
      await save(data);
      return sock.sendMessage(ctx.sender, { text: "✅ Utilisateur débanni.", mentions: [jid] });
    }
  },
  {
    name: "banlist",
    aliases: ["listban"],
    category: "settings",
    description: "Liste les bannis",
    async execute(sock, msg, args, ctx) {
      const data = load();
      if (!data.ban.length) return sock.sendMessage(ctx.sender, { text: "🚫 Aucun utilisateur banni." });

      return sock.sendMessage(ctx.sender, {
        text: "🚫 BANNIS\n\n" + data.ban.map(item => "• @" + item.split("@")[0]).join("\n"),
        mentions: data.ban
      });
    }
  },
  {
    name: "botdp",
    category: "settings",
    description: "Change la photo du bot",
    async execute(sock, msg, args, ctx) {
      if (!await owner(sock, ctx)) return;
      const url = args[0];
      if (!url) return sock.sendMessage(ctx.sender, { text: "🖼️ Utilisation : .botdp URL_IMAGE" });

      try {
        await sock.updateProfilePicture(sock.user.id, { url });
        return sock.sendMessage(ctx.sender, { text: "🖼️ Photo du bot mise à jour." });
      } catch (error) {
        return sock.sendMessage(ctx.sender, { text: "❌ Impossible de changer la photo : " + error.message });
      }
    }
  }
];
