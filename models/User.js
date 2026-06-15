const bcrypt = require('bcryptjs');
const db = require('../database');

class User {
  async findByEmail(email) {
    try {
      const row = await db.get("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [email]);
      return row || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async findById(id) {
    try {
      const row = await db.get("SELECT * FROM users WHERE id = ?", [parseInt(id)]);
      return row || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getAll() {
    try {
      const rows = await db.all("SELECT * FROM users ORDER BY id ASC");
      return rows;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async create({ firstName, lastName, email, phoneNumber, password, verificationToken }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdAt = new Date().toISOString();
      const result = await db.run(
        "INSERT INTO users (firstName, lastName, email, phoneNumber, password, createdAt, isVerified, verificationToken) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
        [firstName, lastName, email.toLowerCase(), phoneNumber, hashedPassword, createdAt, verificationToken]
      );
      return {
        id: result.lastID,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phoneNumber,
        createdAt,
        isVerified: 0,
        verificationToken
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async verifyEmail(token) {
    try {
      const row = await db.get("SELECT * FROM users WHERE verificationToken = ?", [token]);
      if (!row) return null;
      await db.run("UPDATE users SET isVerified = 1, verificationToken = NULL WHERE id = ?", [row.id]);
      return row;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async update(id, { firstName, lastName, email, phoneNumber, password }) {
    try {
      const user = await this.findById(id);
      if (!user) return null;

      const updatedFirstName = firstName || user.firstName;
      const updatedLastName = lastName || user.lastName;
      const updatedEmail = (email || user.email).toLowerCase();
      const updatedPhoneNumber = phoneNumber || user.phoneNumber;
      
      let updatedPassword = user.password;
      if (password) {
        updatedPassword = await bcrypt.hash(password, 10);
      }

      await db.run(
        "UPDATE users SET firstName = ?, lastName = ?, email = ?, phoneNumber = ?, password = ? WHERE id = ?",
        [updatedFirstName, updatedLastName, updatedEmail, updatedPhoneNumber, updatedPassword, parseInt(id)]
      );

      return {
        id: parseInt(id),
        firstName: updatedFirstName,
        lastName: updatedLastName,
        email: updatedEmail,
        phoneNumber: updatedPhoneNumber
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async delete(id) {
    try {
      const result = await db.run("DELETE FROM users WHERE id = ?", [parseInt(id)]);
      return result.changes > 0;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

module.exports = new User();
