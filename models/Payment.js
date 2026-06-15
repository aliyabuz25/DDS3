const db = require('../database');

class Payment {
  async getAll() {
    try {
      const rows = await db.all("SELECT * FROM payments ORDER BY id ASC");
      return rows;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async create({ userId, userEmail, productId, amount, currency, status, transactionId }) {
    try {
      const uId = parseInt(userId) || 0;
      const email = userEmail || 'unknown@example.com';
      const prodId = productId || 'unknown_product';
      const amt = parseFloat(amount) || 0.0;
      const curr = currency || 'USD';
      const stat = status || 'pending';
      const txId = transactionId || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const createdAt = new Date().toISOString();

      const result = await db.run(
        "INSERT INTO payments (userId, userEmail, productId, amount, currency, status, transactionId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [uId, email, prodId, amt, curr, stat, txId, createdAt]
      );

      return {
        id: result.lastID,
        userId: uId,
        userEmail: email,
        productId: prodId,
        amount: amt,
        currency: curr,
        status: stat,
        transactionId: txId,
        createdAt
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

module.exports = new Payment();
