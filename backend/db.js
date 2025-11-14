const sqlite3 = require('sqlite3').verbose();

// 1. 建立連線：
// 這會自動在 backend 資料夾建立一個 'project.db' 檔案
const db = new sqlite3.Database('./project.db', (err) => {
  if (err) {
    console.error('Error connecting to database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// 2. 建立資料表 (Table)：
// 執行一次即可，`IF NOT EXISTS` 會防止重複建立
const initDb = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);
  // 未來您也可以在這裡建立 'documents' 資料表
  // CREATE TABLE IF NOT EXISTS documents (
  //   doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
  //   user_id INTEGER,
  //   title TEXT,
  //   content TEXT,
  //   FOREIGN KEY(user_id) REFERENCES users(id)
  // );
};

// 匯出資料庫物件和初始化函式
module.exports = { db, initDb };
