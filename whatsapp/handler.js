const config = require("../config");
const commandLoader = require("../lib/commandLoader");
const permissionMiddleware = require("../lib/permissionMiddleware");
const activityTracker = require("../lib/activityTracker");
const antispam = require("../lib/antispam");
const groupProtection = require("../lib/groupProtection");
const settings = require("../lib/settingsStore");
const fs = require("fs-extra");
const path = require("path");

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
    [/(bonjour|salut|slt|hello|coucou)/, "👋"],
    [/(merci|thanks|thank you|thx)/, "❤️"],
    [/(mdr|mdrr|ptdr|lol)|😂|🤣/, "😂"],
    [/(bravo|félicitations|felicitations|gg)/, "🔥"],
    [/(bonne nuit|good night)/, "🌙"],
    [/(bonne chance|good luck)/, "🍀"],
    [/(ok|d'accord|dac|compris|exact)/, "👍"],
    [/(waouh|wow|incroyable|magnifique)/, "🤩"],
    [/(triste|désolé|desole|pardon)/, "❤️"],
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
    if (current.online) {
      await sock.sendPresenceUpdate("available", jid);
    }
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

async function messageHandler(sock, msg) {
  try {
    const text = getMessageText(msg);
    if (!text) return;

    // Enregistre l'identité du compte WhatsApp connecté comme propriétaire
    // si aucun numéro owner valide n'est configuré.
    permissionMiddleware.setRuntimeOwner(sock);

    const sender = msg.key.remoteJid;
    const isGroup = msg.key.remoteJid?.endsWith("@g.us");
    const senderNumber = msg.key.participant || sender;
    const baseSettings = settings.get(isGroup ? sender : "global");
    const userScope = "user:" + String(senderNumber).replace(/[^0-9]/g, "");
    const userSettings = settings.get(userScope);
    const current = { ...baseSettings, mode: userSettings.mode || baseSettings.mode || "public" };

    if (isGroup && !msg.key.fromMe) {
      await activityTracker.record(sender, senderNumber);
      const blocked = await groupProtection.protectMessage(sock, msg, text);
      if (blocked) return;

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

              if (botMember?.admin) {
                await sock.sendMessage(sender, { delete: msg.key });
              }
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

    if (current.mode === "private" && !msg.key.fromMe && !permissionMiddleware.isOwnerOrSudo(senderNumber)) {
      return;
    }

    if (config.maintenance && !permissionMiddleware.isOwnerOrSudo(senderNumber)) {
      return sock.sendMessage(sender, { text: "🔧 Bot is under maintenance. Please try again later." });
    }

    if (current.autoread && !msg.key.fromMe) {
      try { await sock.readMessages([msg.key]); } catch {}
    }

    await maybeReact(sock, msg, text, current);
    await applyPresence(sock, sender, current);

    if (!text.startsWith(current.prefix)) return;

    const args = text.slice(current.prefix.length).trim().split(/s+/);
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