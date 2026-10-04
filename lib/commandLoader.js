const fs = require("fs-extra");
const path = require("path");

let commands = new Map();
const { applyInconnuAliases } = require("./inconnuCompat");

async function loadCommands() {
  const commandsDir = path.join(__dirname, "../commands");

  try {
    const categories = fs.readdirSync(commandsDir);

    for (const category of categories) {
      const categoryPath = path.join(commandsDir, category);
      if (!fs.statSync(categoryPath).isDirectory()) continue;

      const files = fs.readdirSync(categoryPath).filter(file => file.endsWith(".js"));

      for (const file of files) {
        try {
          const loaded = require(path.join(categoryPath, file));
          const commandList = Array.isArray(loaded) ? loaded : [loaded];

          for (const command of commandList) {
            if (!command || !command.name || typeof command.execute !== "function") continue;

            if (!command.category) command.category = category.toLowerCase();
            commands.set(command.name.toLowerCase(), command);

            if (Array.isArray(command.aliases)) {
              command.aliases.forEach(alias => {
                commands.set(String(alias).toLowerCase(), command);
              });
            }

            console.log(`✅ Loaded command: ${command.name} [${command.category}]`);
          }
        } catch (error) {
          console.error(`❌ Error loading ${file}:`, error.message);
        }
      }
    }

    applyInconnuAliases(commands);
    console.log(`\n📦 Total command entries loaded: ${commands.size}`);
    return true;
  } catch (error) {
    console.error("Error loading commands:", error);
    return false;
  }
}

function getCommand(name) {
  return commands.get(String(name).toLowerCase());
}

function getCommands() {
  return Array.from(new Set(commands.values()));
}

function reloadCommands() {
  commands.clear();
  return loadCommands();
}

module.exports = {
  loadCommands,
  getCommand,
  getCommands,
  reloadCommands
};