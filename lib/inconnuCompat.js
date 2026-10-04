const extra = {
  // INCONNU XD V1 feature names mapped to safe NOXIS equivalents where implemented.
  alive: "ping",
  alwaysonline: "online",
  autoreact: "autoreact",
  autoread: "autoread",
  gpinfo: "groupinfo",
  linkgc: "grouplink",
  hidetag: "hidetag",
  tagall: "tagall",
  kickall: "kickall",
  promoteall: "promote",
  demoteall: "demote",
  play2: "play",
  song: "play",
  gpt: "ai",
  gemini: "ai",
  repo: "repo",
  ping: "ping",
  botinfo: "botinfo",
  restart: "restart",
  runtime: "runtime",
  quran: "quran",
  waifu: "waifu",
  games: "games",
  joke: "joke",
  truth: "truth",
  flirt: "flirt",
  cal: "cal",
  report: "report",
  sticker: "sticker",
  qc: "qc",
  tohd2: "hd",
  tomp3: "tomp3",
  tourl: "tourl",
  imdb: "imdb",
  lyrics: "lyrics",
  githubstalk: "githubstalk",
  gimage: "gimage",
  removebg: "removebg",
  download: "download",
  dl: "download"
};

function registerCompat(commands) {
  for (const [alias, target] of Object.entries(extra)) {
    if (!commands.has(alias) && commands.has(target)) commands.set(alias, commands.get(target));
  }
}

module.exports = { registerCompat };