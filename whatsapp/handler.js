const config = require("../config");
const commandLoader = require("../lib/commandLoader");
const permissionMiddleware = require("../lib/permissionMiddleware");
const activityTracker = require("../lib/activityTracker");
const antispam = require("../lib/antispam");
const groupProtection = require("../lib/groupProtection");
const settings = require("../lib/settingsStore");

let commandsLoaded = false;

function getMessageText(msg) {
  return msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    "";
}

function reactionFor(text) {
  const value = text.trim().toLowerCase();
  const rules = [
    [/\b(bonjour|salut|slt|hello|coucou)\b/, "👋"],
    [/\b(merci|thanks|thank you|thx)\b/, "❤️"],
    [/\b(mdr|mdrr|ptdr|lol)\b|😂|🤣/, "😂"],
    [/\b(bravo|félicitations|felicitations|gg)\b/, "🔥"],
    [/\b(bonne nuit|good night)\b/, "🌙"],
    [/\b(bonne chance|good luck)\b/, "🍀"],
    [/\b(ok|d'accord|dac|compris|exact)\b/, "👍"],
    [/\b(waouh|wow|incroyable|magnifique)\b/, "🤩"],
    [/\b(triste|désolé|desole|pardon)\b/, "❤️"],
    [/^[❤️💔😂🤣😍🔥👍👎👏🎉🤩😎🥳]+$/, "🔥"]
  ];
  for (const [pattern, emoji] of rules) {
    if (pattern.test(value)) return emoji;
  }
  return null;
}

async function react(sock, msg, emoji) {
  try {
    await sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
  } catch (error) {
    console.error("Reaction error:", error.message);
  }
}

async function maybeReact(sock, msg, text, current) {
  if (!current.autoreact || msg.key.fromMe) return;
  if (!text || text.startsWith(current.prefix)) return;
  const emoji = reactionFor(text);
  if (emoji) await react(sock, msg, emoji);
}

async function applyPresence(sock, jid, current) {
  try {
    if (current.online) await sock.sendPresenceUpdate("available", jid);
  } catch (error) {
    console.error("Presence error:", error.message);
  }
}

function isSettingsPrivileged(senderNumber) {
  try {
    return permissionMiddleware.isOwnerOrSudo(senderNumber);
  } catch {
    return false;
  }
}

function sameNumber(a, b) {
  const na = String(a || "").split(":")[0].replace(/\D/g, "");
  const nb = String(b || "").split(":")[0].replace(/\D/g, "");
  return Boolean(na && nb && na === nb);
}

async function messageHandler(sock, msg) {
  try {
    const text = getMessageText(msg);
    if (!text) return;

    permissionMiddleware.setRuntimeOwner(sock);

    const sender = msg.key.remoteJid;
    const connectedId = sock.user?.id;
    const isGroup = sender?.endsWith("@g.us");
    const senderNumber = isGroup ? (msg.key.participant || "") : sender;

    // Le numéro qui a connecté WhatsApp reste le seul propriétaire
    // autorisé à utiliser les commandes et réactions du bot.
    // Exception importante : en groupe, la protection AntiLink/AntiSpam
    // doit pouvoir inspecter les messages des autres membres AVANT ce filtre.
    const isConnectedOwner = sameNumber(senderNumber, connectedId);

    // En conversation privée, seuls les messages du compte connecté
    // sont traités. En groupe, on laisse d'abord passer la protection.
    if (!isGroup && !isConnectedOwner) return;

    const baseSettings = settings.get(isGroup ? sender : "global");
    const userScope = "user:" + String(senderNumber).replace(/[^0-9]/g, "");
    const userSettings = settings.get(userScope);
    const current = { ...baseSettings, mode: userSettings.mode || baseSettings.mode || "public" };

    if (isGroup && !msg.key.fromMe) {
      await activityTracker.record(sender, senderNumber);

      // AntiLink/AntiSpam doit fonctionner pour tous les membres du groupe,
      // pas uniquement pour le propriétaire du bot.
      const blocked = await groupProtection.protectMessage(sock, msg, text);
      if (blocked) return;

      // Après la protection, seul le numéro qui a connecté le bot peut
      // continuer vers les réactions, commandes et autres fonctions.
      if (!isConnectedOwner) return;

      if (current.antispam) {
        const meta = await sock.groupMetadata(sender);
        const member = meta.participants.find(p => p.id === senderNumber);
        const isAdmin = !!member?.admin;

        if (!isAdmin) {
          const count = antispam.check(sender, senderNumber);
          if (count > 5) {
            try {
              const botId = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
              const botMember = meta.participants.find(p => p.id === botId);
              if (botMember?.admin) await sock.sendMessage(sender, { delete: msg.key });
            } catch (error) {
              console.error("Antispam delete error:", error.message);
            }
            return;
          }
        } else {
          antispam.clear(sender, senderNumber);
        }
      }
    }

    if (current.mode === "private" && !msg.key.fromMe) return;

    if (config.maintenance && !msg.key.fromMe) {
      return sock.sendMessage(sender, { text: "🔧 Bot is under maintenance. Please try again later." });
    }

    if (current.autoread && !msg.key.fromMe) {
      try { await sock.readMessages([msg.key]); } catch {}
    }

    await maybeReact(sock, msg, text, current);
    await applyPresence(sock, sender, current);

    if (!text.startsWith(current.prefix)) return;

    const args = text.slice(current.prefix.length).trim().split(/\s+/);
    const commandName = args[0]?.toLowerCase();
    if (!commandName) return;

    const commandEmoji = {
      menu: "📋", help: "📋", ping: "🏓", play: "▶️", ask: "🧠", ai: "🧠",
      download: "📥", dl: "📥", tagall: "📢", everyone: "📢", groupinfo: "👥",
      ginfo: "👥", kick: "🛡️", remove: "🛡️", promote: "👑", demote: "⬇️", default: "⚡"
    };
    await react(sock, msg, commandEmoji[commandName] || commandEmoji.default);

    const hasPermission = msg.key.fromMe
      ? true
      : await permissionMiddleware(sock, msg, senderNumber, isGroup);

    if (!hasPermission) {
      return sock.sendMessage(sender, { text: "❌ You don't have permission to use this command." });
    }

    try {
      if (!commandsLoaded) {
        await commandLoader.loadCommands();
        commandsLoaded = true;
      }

      const command = commandLoader.getCommand(commandName);

      if (command?.category === "settings" && !msg.key.fromMe && !isSettingsPrivileged(senderNumber)) {
        return sock.sendMessage(sender, { text: "❌ Les réglages NOXIS sont réservés au propriétaire/SUDO." });
      }

      if (command?.category === "owner" && !msg.key.fromMe && !permissionMiddleware.isOwnerOrSudo(senderNumber)) {
        return sock.sendMessage(sender, { text: "❌ Cette commande est réservée au propriétaire/SUDO." });
      }

      if (!command) {
        return sock.sendMessage(sender, {
          text: "❌ Command \`" + commandName + "\` not found.\nType \`" + current.prefix + "menu\` for all commands."
        });
      }

      await command.execute(sock, msg, args.slice(1), {
        sender, isGroup, senderNumber, text, args: args.slice(1)
      });
    } catch (error) {
      console.error("Command execution error:", error);
      return sock.sendMessage(sender, { text: "⚠️ Error executing command: " + error.message });
    }
  } catch (error) {
    console.error("Message handler error:", error);
  }
}

module.exports = messageHandler;
