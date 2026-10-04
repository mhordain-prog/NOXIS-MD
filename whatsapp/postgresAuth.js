const { Pool } = require("pg");
const { initAuthCreds, BufferJSON } = require("@whiskeysockets/baileys");

function encode(value) {
  return JSON.stringify(value, BufferJSON.replacer);
}

function decode(value) {
  return JSON.parse(value, BufferJSON.reviver);
}

async function usePostgresAuthState(connectionString) {
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_auth_creds (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS whatsapp_auth_keys (
      type TEXT NOT NULL,
      id TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (type, id)
    );
  `);

  const result = await pool.query("SELECT value FROM whatsapp_auth_creds WHERE id = 1");
  const creds = result.rows[0] ? decode(result.rows[0].value) : initAuthCreds();

  const keys = {
    get: async (type, ids) => {
      if (!ids.length) return {};
      const r = await pool.query(
        "SELECT id, value FROM whatsapp_auth_keys WHERE type = $1 AND id = ANY($2::text[])",
        [type, ids]
      );
      const out = {};
      for (const row of r.rows) out[row.id] = decode(row.value);
      return out;
    },
    set: async (data) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const type of Object.keys(data)) {
          for (const id of Object.keys(data[type])) {
            const value = data[type][id];
            if (value === null || value === undefined) {
              await client.query(
                "DELETE FROM whatsapp_auth_keys WHERE type = $1 AND id = $2",
                [type, id]
              );
            } else {
              await client.query(
                `INSERT INTO whatsapp_auth_keys (type, id, value)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (type, id) DO UPDATE SET value = EXCLUDED.value`,
                [type, id, encode(value)]
              );
            }
          }
        }
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    }
  };

  const saveCreds = async () => {
    await pool.query(
      `INSERT INTO whatsapp_auth_creds (id, value) VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value`,
      [encode(creds)]
    );
  };

  console.log("💾 WhatsApp session storage: Render PostgreSQL");
  return { state: { creds, keys }, saveCreds, pool };
}

async function clearPostgresAuthState(pool) {
  if (pool) await pool.query("TRUNCATE whatsapp_auth_keys, whatsapp_auth_creds");
}

module.exports = { usePostgresAuthState, clearPostgresAuthState };
