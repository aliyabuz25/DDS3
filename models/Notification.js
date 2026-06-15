const db = require('../database');

class Notification {
  async getAll() {
    try {
      const rows = await db.all("SELECT * FROM notifications ORDER BY id ASC");
      return rows;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async create({ title, message, type, sentTo }) {
    try {
      const notifTitle = title || 'System Update';
      const notifMessage = message || '';
      const notifType = type || 'info';
      const notifSentTo = sentTo || 'all';
      const createdAt = new Date().toISOString();

      const result = await db.run(
        "INSERT INTO notifications (title, message, type, sentTo, createdAt) VALUES (?, ?, ?, ?, ?)",
        [notifTitle, notifMessage, notifType, notifSentTo, createdAt]
      );

      return {
        id: result.lastID,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        sentTo: notifSentTo,
        createdAt
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async delete(id) {
    try {
      const result = await db.run("DELETE FROM notifications WHERE id = ?", [parseInt(id)]);
      return result.changes > 0;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

module.exports = new Notification();
