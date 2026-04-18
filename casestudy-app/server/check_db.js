const db = require('better-sqlite3')('dev.db');
const rows = db.prepare('SELECT id, title, required_steps FROM "Case"').all();
console.log(JSON.stringify(rows, null, 2));
db.close();
