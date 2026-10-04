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
    if (current.online) {
      await sock.sendPresenceUpdate("available", jid);
    }
  } catch (error) {
    console.error("Presence error:", error.message);
  }
}

function isSettingsPrivileged(senderNumber) {
  try {
    const s = settings.get("global");
    const owner = String(s.ownernumber || config.owner || "").replace(/\D/g, "");
    const sender = String(senderNumber || "").split(":")[0].replace(/\D/g, "");
    if (owner && sender === owner) return true;

    const file = path.join(__dirname, "../data/access.json");
    const access = fs.readJsonSync(file);
    return (access.sudo || []).some(jid =>
      String(jid).split("@")[0].replace(/\D/g, "") === sender
    );
  } catch {
    return false;
  }
}

async function messageHandler(sock, msg) {
  try {
    const text = getMessageText(msg);
    if (!text) return;

    const sender = msg.key.remoteJid;
    const isGroup = msg.key.remoteJid?.endsWith("@g.us");
    const senderNumber = msg.key.participant || sender;
    const current = settings.get(isGroup ? sender : "global");

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

    if (config.maintenance && senderNumber !== config.owner) {
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
