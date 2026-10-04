const config = require("../config");
const commandLoader = require("../lib/commandLoader");
const permissionMiddleware = require("../lib/permissionMiddleware");
const activityTracker = require("../lib/activityTracker");
const groupProtection = require("../lib/groupProtection");

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
    [/\\b(bonjour|salut|slt|hello|coucou)\\b/, "👋"],
    [/\\b(merci|thanks|thank you|thx)\\b/, "❤️"],
    [/\\b(mdr|mdrr|ptdr|lol)\\b|😂|🤣/, "😂"],
    [/\\b(bravo|félicitations|felicitations|gg)\\b/, "🔥"],
    [/\\b(bonne nuit|good night)\\b/, "🌙"],
    [/\\b(bonne chance|good luck)\\b/, "🍀"],
    [/\\b(ok|d'accord|dac|compris|exact)\\b/, "👍"],
    [/\\b(waouh|wow|incroyable|magnifique)\\b/, "🤩"],
    [/\\b(triste|désolé|desole|pardon)\\b/, "❤️"],
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

async function maybeReact(sock, msg, text) {
  if (!config.autoReact || msg.key.fromMe) return;
  if (!text || text.startsWith(config.prefix)) return;
  const emoji = reactionFor(text);
  if (emoji) await react(sock, msg, emoji);
}

async function messageHandler(sock, msg) {
  try {
    const text = getMessageText(msg);
    if (!text) return;

    const sender = msg.key.remoteJid;
    const isGroup = msg.key.remoteJid?.endsWith("@g.us");
    const senderNumber = msg.key.participant || sender;

    if (isGroup && !msg.key.fromMe) {
      await activityTracker.record(sender, senderNumber);
      const blocked = await groupProtection.protectMessage(sock, msg, text);
      if (blocked) return;
    }

    if (config.maintenance && senderNumber !== config.owner) {
      return sock.sendMessage(sender, { text: "🔧 Bot is under maintenance. Please try again later." });
    }

    await maybeReact(sock, msg, text);

    if (!text.startsWith(config.prefix)) return;

    const args = text.slice(config.prefix.length).trim().split(/\s+/);
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

      if (!command) {
        return sock.sendMessage(sender, {
          text: "❌ Command \`" + commandName + "\` not found.\nType \`" + config.prefix + "menu\` for all commands."
        });
      }

      await command.execute(sock, msg, args, {
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