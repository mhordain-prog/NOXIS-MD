const { MongoClient } = require("mongodb");
const {
  initAuthCreds,
  BufferJSON
} = require("@whiskeysockets/baileys");

let client;
let collection;

function encode(value) {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer));
}

function decode(value) {
  return JSON.parse(value, BufferJSON.reviver);
}

async function useMongoDBAuthState(uri, dbName = "noxis") {
  if (!uri) {
    throw new Error("MONGODB_URI is required for persistent WhatsApp sessions");
  }

  client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);
  collection = db.collection("whatsapp_auth");

  const credsDoc = await collection.findOne({ _id: "creds" });
  const creds = credsDoc ? decode(credsDoc.value) : initAuthCreds();

  const keys = {
    get: async (type, ids) => {
      const docs = await collection
        .find({ type, _id: { $in: ids.map((id) => `key:${type}:${id}`) } })
        .toArray();

      const result = {};
      for (const doc of docs) {
        result[doc.id] = decode(doc.value);
      }
      return result;
    },

    set: async (data) => {
      const operations = [];

      for (const type of Object.keys(data)) {
        for (const id of Object.keys(data[type])) {
          const value = data[type][id];
          const _id = `key:${type}:${id}`;

          if (value === null || value === undefined) {
            operations.push({
              deleteOne: { filter: { _id } }
            });
          } else {
            operations.push({
              updateOne: {
                filter: { _id },
                update: {
                  $set: {
                    type,
                    id,
                    value: JSON.stringify(encode(value))
                  }
                },
                upsert: true
              }
            });
          }
        }
      }

      if (operations.length) {
        await collection.bulkWrite(operations);
      }
    }
  };

  const saveCreds = async () => {
    await collection.updateOne(
      { _id: "creds" },
      {
        $set: {
          value: JSON.stringify(encode(creds))
        }
      },
      { upsert: true }
    );
  };

  await collection.createIndex({ type: 1, id: 1 });

  console.log("💾 WhatsApp session storage: MongoDB");
  return {
    state: { creds, keys },
    saveCreds
  };
}

module.exports = { useMongoDBAuthState };
