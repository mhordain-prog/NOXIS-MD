const config = require("../config");
const commandLoader = require("../lib/commandLoader");
const permissionMiddleware = require("../lib/permissionMiddleware");

let commandsLoaded = false;

function getMessageText(msg) {
  return msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    "";
}

async function maybeReact(sock, msg, text) {
  const value = text.trim().toLowerCase();
  if (!value || value.startsWith(config.prefix)) return;

  let emoji = null;

  if (/\b(bonjour|salut|slt|hello|coucou)\b/.test(value)) emoji = "👋";
  else if (/\b(merci|thanks|thank you)\b/.test(value)) emoji = "❤️";
  else if (/\b(mdrr?|ptdr|lol|😂|🤣)\b/.test(value)) emoji = "😂";
  else if (/\b(bravo|félicitations|felicitations|gg)\b/.test(value)) emoji = "🔥";
  else if (/\b(bonne nuit|good night)\b/.test(value)) emoji = "🌙";
  else if (/\b(triste|désolé|desole)\b/.test(value)) emoji = "❤️";
  else if (/\b(ok|d'accord|dac|compris)\b/.test(value)) emoji = "👍";

  if (!emoji) return;

  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key }
    });
  } catch (error) {
    console.error("Reaction error:", error.message);
  }
}

async function messageHandler(sock, msg) {
  try {
    const text = getMessageText(msg);
    if (!text) return;

    const sender = msg.key.remoteJid;
    const isGroup = msg.key.remoteJid?.endsWith("@g.us");
    const senderNumber = msg.key.participant || sender;

    if (config.maintenance && senderNumber !== config.owner) {
      return sock.sendMessage(sender, {
        text: "🔧 Bot is under maintenance. Please try again later."
      });
    }

    // React to normal messages before command processing.
    await maybeReact(sock, msg, text);

    if (!text.startsWith(config.prefix)) return;

    const args = text.slice(config.prefix.length).trim().split(/\s+/);
    const commandName = args[0]?.toLowerCase();
    if (!commandName) return;

    const hasPermission = msg.key.fromMe
      ? true
      : await permissionMiddleware(sock, msg, senderNumber, isGroup);

    if (!hasPermission) {
      return sock.sendMessage(sender, {
        text: "❌ You don't have permission to use this command."
      });
    }

    try {
      if (!commandsLoaded) {
        await commandLoader.loadCommands();
        commandsLoaded = true;
      }

      const command = commandLoader.getCommand(commandName);

      if (!command) {
        return sock.sendMessage(sender, {
          text: `❌ Command \`${commandName}\` not found.\nType \`${config.prefix}menu\` for all commands.`
        });
      }

      await command.execute(sock, msg, args, {
        sender,
        isGroup,
        senderNumber,
        text,
        args: args.slice(1)
      });
    } catch (error) {
      console.error("Command execution error:", error);
      return sock.sendMessage(sender, {
        text: `⚠️ Error executing command: ${error.message}`
      });
    }
  } catch (error) {
    console.error("Message handler error:", error);
  }
}

module.exports = messageHandler;
