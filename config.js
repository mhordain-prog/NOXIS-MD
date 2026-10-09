require("dotenv").config();

module.exports = {
  owner: process.env.OWNER_NUMBER || "234XXXXXXXXXX",
  botName: process.env.BOT_NAME || "NOXIS-MD",
  prefix: process.env.PREFIX || ".",
  version: process.env.BOT_VERSION || "2.0.0",

  telegramToken: process.env.TELEGRAM_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,

  botMode: process.env.BOT_MODE || "public",
  autoRead: process.env.AUTO_READ === "true",
  autoTyping: process.env.AUTO_TYPING === "true",
  autoRecord: process.env.AUTO_RECORD === "true",
  autoReact: process.env.AUTO_REACT !== "false",

  openaiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  imgurKey: process.env.IMGUR_API_KEY || "",
  youtubeKey: process.env.YOUTUBE_API_KEY || "",

  dbPath: process.env.DB_PATH || "./database",
  sessionsPath: "./sessions",
  logsPath: "./logs",

  port: process.env.PORT || 3000,
  host: process.env.HOST || "0.0.0.0",

  maintenance: process.env.MAINTENANCE === "true"
};
