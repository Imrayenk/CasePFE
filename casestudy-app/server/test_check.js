const path = require('path');
const dbPath = path.resolve(__dirname, 'dev.db');
const Database = require('better-sqlite3');
const db = new Database(dbPath);

try {
  const cases = db.prepare('SELECT id, title, status, length(attachments) as file_len FROM "Case" ORDER BY createdAt DESC LIMIT 5').all();
  console.log('Cases:', cases);
} catch (e) {
  console.log(e);
}
db.close();
