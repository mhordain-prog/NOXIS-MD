const config = require("../../config");

const send = (sock, to, text) => sock.sendMessage(to, { text });

module.exports = [
  {
    name: "helpme",
    aliases: ["aide", "studyhelp"],
    category: "education",
    description: "Aide rapide sur les commandes",
    async execute(sock, msg, args, ctx) {
      return send(sock, ctx.sender,
        "📚 NOXIS-MD — AIDE\n\n" +
        "🧠 .ai / .ask question\n" +
        "📚 .wiki sujet\n" +
        "📖 .define mot\n" +
        "🧮 .calc expression\n" +
        "👥 .groupinfo / .admins\n" +
        "📢 .tagall message\n" +
        "🖼️ .mediainfo\n" +
        "🎲 .dice\n" +
        "🔗 .short URL\n\n" +
        `Menu complet: ${config.prefix}menu`
      );
    }
  },
  {
    name: "convert",
    aliases: ["conversion", "convertir"],
    category: "education",
    description: "Conversions courantes",
    async execute(sock, msg, args, ctx) {
      const n = Number(args[0]);
      const from = (args[1] || "").toLowerCase();
      const to = (args[2] || "").toLowerCase();
      if (!Number.isFinite(n) || !from || !to) {
        return send(sock, ctx.sender, `📐 Usage: ${config.prefix}convert 10 km mi`);
      }
      const factors = {
        "km:mi": 0.621371,
        "mi:km": 1.609344,
        "m:ft": 3.28084,
        "ft:m": 0.3048,
        "kg:lb": 2.20462262,
        "lb:kg": 0.45359237
      };
      const key = from + ":" + to;
      let result;
      if (key === "c:f") result = n * 9 / 5 + 32;
      else if (key === "f:c") result = (n - 32) * 5 / 9;
      else if (factors[key]) result = n * factors[key];
      else return send(sock, ctx.sender, "❌ Conversion non prise en charge.");
      return send(sock, ctx.sender, `📐 ${n} ${from} = ${Number(result.toFixed(6))} ${to}`);
    }
  }
];
