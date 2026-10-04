const axios = require("axios");

async function getPhoto(gender) {
  const res = await axios.get(
    "https://randomuser.me/api/",
    { params: { gender, inc: "picture", results: 1 }, timeout: 10000 }
  );
  const picture = res.data?.results?.[0]?.picture;
  if (!picture?.large) throw new Error("Image indisponible");
  return picture.large;
}

function makeCommand(name, gender, label) {
  return {
    name,
    category: "profile",
    description: "Envoie une photo de profil " + label + " aléatoire.",
    async execute(sock, msg, args, ctx) {
      try {
        const url = await getPhoto(gender);
        await sock.sendMessage(ctx.sender, {
          image: { url },
          caption: "🖼️ DP " + label.toUpperCase() + "\n" +
            "Commande : ." + name
        });
      } catch (error) {
        console.error("DP error:", error.message);
        await sock.sendMessage(ctx.sender, {
          text: "❌ Impossible de récupérer une photo DP pour le moment. Réessaie."
        });
      }
    }
  };
}

const commands = [];

for (let i = 1; i <= 22; i++) {
  commands.push(makeCommand("girldp" + i, "female", "fille"));
}

for (let i = 1; i <= 22; i++) {
  commands.push(makeCommand("boydp" + i, "male", "garçon"));
}

module.exports = commands;
