const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const userModel = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforbiblecms';

// Nodemailer SMTP Transport setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

class AuthController {
  async register(req, res) {
    try {
      const { firstName, lastName, email, phoneNumber, password } = req.body;

      if (!firstName || !lastName || !email || !phoneNumber || !password) {
        return res.status(400).json({ 
          message: 'Lütfen tüm alanları doldurun (firstName, lastName, email, phoneNumber, password).' 
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Geçersiz e-posta formatı.' });
      }

      const userExists = await userModel.findByEmail(email);
      if (userExists) {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda.' });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');

      const newUser = await userModel.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        verificationToken
      });

      // Send confirmation email
      const verificationLink = `${req.protocol}://${req.get('host')}/api/auth/verify?token=${verificationToken}`;
      
      console.log('--- E-POSTA ONAY BAĞLANTISI ---');
      console.log(verificationLink);
      console.log('-------------------------------');

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@biblecms.com',
        to: email,
        subject: 'BibleCMS E-posta Onayı',
        html: `
          <h3>BibleCMS E-posta Onaylama</h3>
          <p>Merhaba ${firstName} ${lastName},</p>
          <p>Kaydınızı tamamlamak için lütfen aşağıdaki bağlantıya tıklayarak e-posta adresinizi onaylayın:</p>
          <p><a href="${verificationLink}" style="padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">E-postamı Onayla</a></p>
          <p>Alternatif olarak bu bağlantıyı tarayıcınıza yapıştırabilirsiniz:</p>
          <p>${verificationLink}</p>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (err) {
        console.warn('SMTP gönderimi başarısız oldu (muhtemelen yapılandırılmadı):', err.message);
      }

      res.status(201).json({
        message: 'Kayıt başarıyla tamamlandı. Lütfen e-postanıza gönderilen onay bağlantısını kontrol edin.',
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          isVerified: 0
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async verify(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ message: 'Onay tokenı bulunamadı.' });
      }

      const user = await userModel.verifyEmail(token);
      if (!user) {
        return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş onay tokenı.' });
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>E-posta Onaylandı | BibleCMS</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css">
        </head>
        <body class="hold-transition login-page">
          <div class="login-box">
            <div class="card card-outline card-success">
              <div class="card-header text-center">
                <h3><b>Bible</b>CMS</h3>
              </div>
              <div class="card-body">
                <p class="login-box-msg">E-posta adresiniz başarıyla onaylandı!</p>
                <div class="text-center">
                  <a href="/login" class="btn btn-success btn-block">Giriş Yap</a>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Lütfen e-posta ve şifre alanlarını doldurun.' 
        });
      }

      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'E-posta veya şifre hatalı.' });
      }

      if (user.isVerified !== 1) {
        return res.status(400).json({ message: 'Lütfen e-posta adresinizi onaylayın.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'E-posta veya şifre hatalı.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        message: 'Giriş başarılı.',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }
}

module.exports = new AuthController();
