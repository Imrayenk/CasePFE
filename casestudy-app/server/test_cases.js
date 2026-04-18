const { apiGet, apiPost } = require('./src/lib/api'); // Not directly usable outside React context

const Database = require('better-sqlite3');
const dbPath = require('path').resolve(__dirname, 'dev.db');

try {
  const db = new Database(dbPath);
  const cases = db.prepare('SELECT id, status, teacherId, length(attachments) as a_len FROM "Case" WHERE status = "active" OR status = "Active"').all();
  console.log('Active Cases:', cases);
  db.close();
}catch(e){
  console.error(e);
}
