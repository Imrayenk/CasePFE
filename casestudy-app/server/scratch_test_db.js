const Database = require('better-sqlite3');
try {
    const db = new Database('dev.db');
    console.log('Successfully opened dev.db');
    console.log('Journal mode:', db.pragma('journal_mode'));
    db.close();
} catch (err) {
    console.error('Failed to open dev.db:', err);
}
