const settings = require("../../lib/settingsStore");
const config = require("../../config");

const bool = v => ["on", "off", "true", "false"].includes(String(v).toLowerCase());
const value = v => ["on", "true"].includes(String(v).toLowerCase());
const send = (sock, to, text, extra = {}) => sock.sendMessage(to, { text, ...extra });

const scopeFor = ctx => ctx.isGroup ? ctx.sender : "global";

const booleanCommands = [
  ["welcome", "welcome", "Welcome"],
  ["goodbye", "goodbye", "Goodbye"],
  ["antilink", "antilink", "Anti-link"],
  ["antidelete", "antidelete", "Anti-delete"],
  ["antiedit", "antiedit", "Anti-edit"],
  ["anticall", "anticall", "Anti-call"],
  ["adminaction", "adminaction", "Admin action"],
  ["autoread", "autoread", "Auto-read"],
  ["autotyping", "autotyping", "Auto-typing"],
  ["autoreact", "autoreact", "Auto-react"],
  ["recording", "recording", "Recording"],
  ["online", "online", "Online"],
  ["statusview", "statusview", "Status-view"],
  ["statuslike", "statuslike", "Status-like"]
];

async function setBool(sock, ctx, key, args, label) {
  const mode = String(args[0] || "").toLowerCase();
  if (!bool(mode)) return send(sock, ctx.sender, "⚙️ Utilisation : ." + key + " on/off");
  await settings.set(scopeFor(ctx), key, value(mode));
  return send(sock, ctx.sender, "⚙️ " + label + " : " + (value(mode) ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌"));
}

const commands = [
  {
    name: "mode",
    category: "settings",
    description: "Choisit le mode public, private ou group",
    async execute(sock, msg, args, ctx) {
      const aliases = { privé: "private", prive: "private", groupes: "group", groupe: "group", groups: "group" };
      const selected = aliases[String(args[0] || "").toLowerCase()] || String(args[0] || "").toLowerCase();

      if (!["public", "private", "group"].includes(selected)) {
        return send(sock, ctx.sender,
          "⚙️ MODES NOXIS\n\n" +
          "• .mode public — tout le monde peut utiliser le bot\n" +
          "• .mode private — propriétaire/SUDO uniquement\n" +
          "• .mode group — commandes uniquement dans les groupes\n\n" +
          "Mode actuel : " + settings.get("global").mode
        );
      }

      await settings.set("global", "mode", selected);
      return send(sock, ctx.sender, "✅ Mode NOXIS réglé sur : " + selected.toUpperCase());
    }
  },

  {
    name: "prefix",
    category: "settings",
    description: "Change le préfixe du bot",
    async execute(sock, msg, args, ctx) {
      const p = String(args[0] || "").trim();
      if (!/^[!?.#$]{1}$/.test(p)) {
        return send(sock, ctx.sender, "⚙️ Utilisation : .prefix !\nPréfixe autorisé : un seul caractère parmi ! ? . # $");
      }
      await settings.set("global", "prefix", p);
      return send(sock, ctx.sender, "⚙️ Nouveau préfixe : " + p);
    }
  },

  ...booleanCommands.map(([name, key, label]) => ({
    name, category: "settings", description: "Réglage " + label,
    async execute(sock, msg, args, ctx) { return setBool(sock, ctx, key, args, label); }
  })),

  {
    name: "botname", category: "settings", description: "Change le nom du bot",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .botname NOXIS");
      const x = v.slice(0, 60);
      await settings.set("global", "botname", x);
      return send(sock, ctx.sender, "🤖 Nom : " + x);
    }
  },
  {
    name: "ownername", category: "settings", description: "Change le nom du propriétaire",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .ownername Nom");
      const x = v.slice(0, 80);
      await settings.set("global", "ownername", x);
      return send(sock, ctx.sender, "👑 Owner : " + x);
    }
  },
  {
    name: "ownernumber", category: "settings", description: "Enregistre le numéro propriétaire",
    async execute(sock, msg, args, ctx) {
      const v = String(args[0] || "").replace(/\D/g, "");
      if (v.length < 6) return send(sock, ctx.sender, "⚙️ Numéro invalide.");
      await settings.set("global", "ownernumber", v);
      return send(sock, ctx.sender, "👑 Numéro owner enregistré.");
    }
  },
  {
    name: "description", category: "settings", description: "Change la description du bot",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .description Texte");
      await settings.set("global", "description", v.slice(0, 300));
      return send(sock, ctx.sender, "📝 Description enregistrée.");
    }
  },
  {
    name: "stickername", category: "settings", description: "Change le nom des stickers",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .stickername NOXIS");
      await settings.set("global", "stickername", v.slice(0, 60));
      return send(sock, ctx.sender, "🏷️ Sticker name : " + v.slice(0, 60));
    }
  },
  {
    name: "settings", category: "settings", description: "Affiche tous les réglages",
    async execute(sock, msg, args, ctx) {
      const s = settings.get(scopeFor(ctx));
      const lines = [
        "⚙️ NOXIS SETTINGS",
        "",
        "🔐 MODE & BOT",
        "Mode: " + settings.get("global").mode,
        "Prefix: " + s.prefix,
        "Bot: " + s.botname,
        "Owner: " + s.ownername,
        "Owner number: " + (s.ownernumber ? "configured" : "not set"),
        "Description: " + s.description,
        "Sticker: " + s.stickername,
        "",
        "👋 WELCOME / GOODBYE",
        "Welcome: " + s.welcome,
        "Goodbye: " + s.goodbye,
        "",
        "🛡️ ANTI-SYSTEM",
        "Antilink: " + s.antilink,
        "Antidelete: " + s.antidelete,
        "Antiedit: " + s.antiedit,
        "Anticall: " + s.anticall,
        "Admin action: " + s.adminaction,
        "",
        "🤖 AUTO-SYSTEM",
        "Autoread: " + s.autoread,
        "Autotyping: " + s.autotyping,
        "Autoreact: " + s.autoreact,
        "Recording: " + s.recording,
        "Online: " + s.online,
        "Status view: " + s.statusview,
        "Status like: " + s.statuslike,
        "",
        "🎨 EMOJI & PATH",
        "React emojis: " + s.reactemojis,
        "Owner emojis: " + s.owneremojis,
        "Edit path: " + s.editpath,
        "Delete path: " + s.delpath
      ];
      return send(sock, ctx.sender, lines.join("\n"));
    }
  },
  {
    name: "setwelcome", category: "settings", description: "Définit le message de bienvenue",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .setwelcome Bienvenue @user !");
      await settings.set(scopeFor(ctx), "welcomeText", v.slice(0, 500));
      return send(sock, ctx.sender, "👋 Message de bienvenue enregistré.");
    }
  },
  {
    name: "setgoodbye", category: "settings", description: "Définit le message de départ",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .setgoodbye Au revoir @user !");
      await settings.set(scopeFor(ctx), "goodbyeText", v.slice(0, 500));
      return send(sock, ctx.sender, "👋 Message de départ enregistré.");
    }
  },
  {
    name: "anticallmsg", category: "settings", description: "Change le message anti-appel",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .anticallmsg Texte");
      await settings.set("global", "anticallmsg", v.slice(0, 500));
      return send(sock, ctx.sender, "📵 Message anti-appel enregistré.");
    }
  },
  {
    name: "reactemojis", category: "settings", description: "Configure les emojis de réaction",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .reactemojis ⚡❤️🔥");
      await settings.set("global", "reactemojis", v.slice(0, 100));
      return send(sock, ctx.sender, "😀 Emojis enregistrés.");
    }
  },
  {
    name: "owneremojis", category: "settings", description: "Configure les emojis owner",
    async execute(sock, msg, args, ctx) {
      const v = args.join(" ").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .owneremojis 👑");
      await settings.set("global", "owneremojis", v.slice(0, 50));
      return send(sock, ctx.sender, "👑 Emojis owner enregistrés.");
    }
  },
  {
    name: "editpath", category: "settings", description: "Configure le chemin anti-edit",
    async execute(sock, msg, args, ctx) {
      const v = String(args[0] || "").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .editpath ./data/edits.json");
      await settings.set("global", "editpath", v);
      return send(sock, ctx.sender, "📝 Edit path enregistré.");
    }
  },
  {
    name: "delpath", category: "settings", description: "Configure le chemin anti-delete",
    async execute(sock, msg, args, ctx) {
      const v = String(args[0] || "").trim();
      if (!v) return send(sock, ctx.sender, "⚙️ Utilisation : .delpath ./data/deleted.json");
      await settings.set("global", "delpath", v);
      return send(sock, ctx.sender, "🗑️ Delete path enregistré.");
    }
  }
];

module.exports = commands;
