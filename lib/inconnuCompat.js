const aliases = {
  alive: "ping", gpinfo: "groupinfo", linkgc: "grouplink", revoke: "revoke",
  hidetag: "hidetag", tagall: "tagall", everyone: "tagall", play2: "play",
  song: "play", dl: "download", fetch: "download", ping: "ping",
  setprefix: "settings", setdesc: "setdesc", promoteall: "promote",
  demoteall: "demote", kickall: "kickall", remove: "remove", kick: "kick",
  promote: "promote", demote: "demote", groupinfo: "groupinfo",
  admins: "admins", members: "members", groupid: "groupid",
  setname: "setname", welcome: "welcome", autoread: "autoread",
  autoreact: "autoreact", alwaysonline: "online", mode: "mode",
  sticker: "sticker", qc: "qc", tohd2: "hd", tomp3: "tomp3",
  tourl: "tourl", romovebg: "removebg", gimage: "gimage",
  githubstalk: "githubstalk", imdb: "imdb", lyrics: "lyrics",
  quran: "quran", waifu: "waifu", games: "games", joke: "joke",
  truth: "truth", flirt: "flirt", cal: "cal", gpt: "ai", gemini: "ai",
  report: "report", repo: "repo", botinfo: "botinfo", runtime: "runtime"
};

function applyInconnuAliases(commands) {
  for (const [alias, target] of Object.entries(aliases)) {
    if (commands.has(alias) || !commands.has(target)) continue;
    commands.set(alias, commands.get(target));
  }
}

module.exports = { applyInconnuAliases };
