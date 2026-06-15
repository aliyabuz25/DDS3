const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Helper to run query with Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Helper to get all rows with Promise
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper to get single row with Promise
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Initialize tables and seed data
async function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Create tables
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phoneNumber TEXT NOT NULL,
            password TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            isVerified INTEGER DEFAULT 0,
            verificationToken TEXT
          )
        `);

        // Safely alter existing users table if columns are missing
        db.run("ALTER TABLE users ADD COLUMN isVerified INTEGER DEFAULT 0", [], () => {});
        db.run("ALTER TABLE users ADD COLUMN verificationToken TEXT", [], () => {});

        db.run(`
          CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            userEmail TEXT NOT NULL,
            productId TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL,
            transactionId TEXT NOT NULL,
            createdAt TEXT NOT NULL
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            sentTo TEXT NOT NULL,
            createdAt TEXT NOT NULL
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS catalogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            thumbnailVertical TEXT NOT NULL,
            thumbnailHorizontal TEXT NOT NULL,
            createdAt TEXT NOT NULL
          )
        `);

        // Check if users exist to seed
        db.get("SELECT COUNT(*) as count FROM users", async (err, row) => {
          if (err) return reject(err);
          if (row.count === 0) {
            console.log('--- SEEDING SQLITE DATABASE ---');
            
            // Seed Users
            const adminHash = await bcrypt.hash('admin123', 10);
            const user2Hash = await bcrypt.hash('veli123', 10);
            const user3Hash = await bcrypt.hash('ayse123', 10);
            const user4Hash = await bcrypt.hash('ahmet123', 10);
            const user5Hash = await bcrypt.hash('fatma123', 10);
            const user6Hash = await bcrypt.hash('mustafa123', 10);
            const user7Hash = await bcrypt.hash('emine123', 10);
            const user8Hash = await bcrypt.hash('mehmet123', 10);
            const user9Hash = await bcrypt.hash('zeynep123', 10);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Admin', 'User', 'admin@biblecms.com', '5550000000', adminHash, new Date().toISOString()]);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Veli', 'Kaya', 'veli@example.com', '5552345678', user2Hash, new Date().toISOString()]);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Ayşe', 'Demir', 'ayse@example.com', '5553456789', user3Hash, new Date().toISOString()]);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Ahmet', 'Yılmaz', 'ahmet.yilmaz@example.com', '5554567890', user4Hash, new Date().toISOString()]);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Fatma', 'Şahin', 'fatma.sahin@example.com', '5555678901', user5Hash, new Date().toISOString()]);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Mustafa', 'Öztürk', 'mustafa.ozturk@example.com', '5556789012', user6Hash, new Date().toISOString()]);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Emine', 'Aydın', 'emine.aydin@example.com', '5557890123', user7Hash, new Date().toISOString()]);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Mehmet', 'Arslan', 'mehmet.arslan@example.com', '5558901234', user8Hash, new Date().toISOString()]);

            db.run("INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, 1)",
              ['Zeynep', 'Çelik', 'zeynep.celik@example.com', '5559012345', user9Hash, new Date().toISOString()]);

            // Seed Payments
            db.run("INSERT INTO payments (userId, userEmail, productId, amount, currency, status, transactionId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [2, 'veli@example.com', 'premium_access_yearly', 49.99, 'USD', 'completed', 'GPA.3312-9842-1209-12345', new Date().toISOString()]);

            db.run("INSERT INTO payments (userId, userEmail, productId, amount, currency, status, transactionId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [2, 'veli@example.com', 'ad_free_monthly', 2.99, 'USD', 'completed', 'GPA.3381-1294-0982-84729', new Date().toISOString()]);

            db.run("INSERT INTO payments (userId, userEmail, productId, amount, currency, status, transactionId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [3, 'ayse@example.com', 'premium_access_yearly', 49.99, 'USD', 'completed', 'GPA.9942-1284-8263-12847', new Date().toISOString()]);

            // Seed Notifications
            db.run("INSERT INTO notifications (title, message, type, sentTo, createdAt) VALUES (?, ?, ?, ?, ?)",
              ['Welcome to BibleCMS', 'Thank you for downloading and registering in the app.', 'success', 'all', new Date().toISOString()]);

            db.run("INSERT INTO notifications (title, message, type, sentTo, createdAt) VALUES (?, ?, ?, ?, ?)",
              ['Premium Catalog Unlocked', 'Your yearly subscription has successfully activated.', 'info', 'veli@example.com', new Date().toISOString()]);

            // Seed Catalogs
            db.run("INSERT INTO catalogs (name, description, thumbnailVertical, thumbnailHorizontal, createdAt) VALUES (?, ?, ?, ?, ?)",
              ['Visual Bible Catalog v1', 'Holy Bible visual catalog containing illustrations and text guides.', 'https://cdn.biblecms.com/images/bible_vertical.jpg', 'https://cdn.biblecms.com/images/bible_horizontal.jpg', new Date().toISOString()]);

            db.run("INSERT INTO catalogs (name, description, thumbnailVertical, thumbnailHorizontal, createdAt) VALUES (?, ?, ?, ?, ?)",
              ['Sample Visual Publication', 'A pre-loaded sample publication showcasing local vertical and horizontal covers.', '/uploads/sample_vertical.jpg', '/uploads/sample_horizontal.jpg', new Date().toISOString()]);
            
            console.log('--- SQLITE DATABASE SEED COMPLETE ---');
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  db,
  run,
  all,
  get,
  initDb
};
