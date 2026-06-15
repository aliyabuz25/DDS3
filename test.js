const fs = require('fs');
const path = require('path');

// Clean up existing sqlite database to ensure clean test environment
const dbPath = path.join(__dirname, 'database.sqlite');
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
  } catch (e) {
    console.log('Could not unlink database file, skipping...');
  }
}

const request = require('supertest');
const app = require('./index');

// Clean up any test uploads afterwards
const uploadsDir = path.join(__dirname, 'uploads');

async function runTests() {
  console.log('--- ENTEGRASYON VE MULTIPART MULTI-UPLOAD TESTLERİ BAŞLATILIYOR ---');

  // Wait for SQLite database to be initialized
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 1: Kayıtta XSS input kontrolü
  console.log('\nTest 1: Kayıtta XSS input kontrolü...');
  const xssRegRes = await request(app)
    .post('/api/register')
    .set('User-Agent', 'bible-appclient')
    .send({
      firstName: '<script>alert("XSS")</script>Ahmet',
      lastName: 'Yılmaz',
      email: 'ahmetxss@example.com',
      phoneNumber: '5551234567',
      password: 'sifre123'
    });
  
  console.log('XSS Kayıt Durumu:', xssRegRes.status);
  console.log('XSS Kayıt Yanıtı (firstName temizlenmiş mi?):', xssRegRes.body.user ? xssRegRes.body.user.firstName : 'Undefined');

  const registeredUserId = xssRegRes.body.user ? xssRegRes.body.user.id : 4;

  // Test 2: Hatalı User-Agent kontrolü
  console.log('\nTest 2: Geçersiz User-Agent kontrolü...');
  const badAgentRes = await request(app)
    .post('/api/register')
    .set('User-Agent', 'InvalidAppClient/1.0')
    .send({
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      email: 'ahmet@example.com',
      phoneNumber: '5551234567',
      password: 'sifre123'
    });
  console.log('Geçersiz User-Agent Durum Kodu:', badAgentRes.status);

  // Test 2.5: E-posta onaysız giriş denemesi (400 Hatası almalı)
  console.log('\nTest 2.5: E-posta onaysız giriş denemesi...');
  const unverifiedLoginRes = await request(app)
    .post('/api/login')
    .set('User-Agent', 'bible-appclient')
    .send({
      email: 'ahmetxss@example.com',
      password: 'sifre123'
    });
  console.log('Onaysız Giriş Durum Kodu (400 bekleniyor):', unverifiedLoginRes.status);
  console.log('Onaysız Giriş Mesajı:', unverifiedLoginRes.body.message);

  // E-posta adresini onaylamak için veri tabanından token'ı çekelim
  const db = require('./database');
  const userRow = await db.get("SELECT verificationToken FROM users WHERE email = ?", ['ahmetxss@example.com']);
  const token = userRow.verificationToken;
  console.log('Veritabanından Alınan Onay Tokenı:', token);

  // E-posta onaylama isteği gönderelim (GET /api/auth/verify)
  console.log('\nTest 2.6: E-posta onaylama (verify) işlemi...');
  const verifyRes = await request(app)
    .get(`/api/auth/verify?token=${token}`)
    .set('User-Agent', 'bible-appclient');
  console.log('E-posta Onaylama Durum Kodu (200 bekleniyor):', verifyRes.status);

  // Test 3: Başarılı Giriş (E-posta onaylandığı için artık başarılı olmalı)
  console.log('\nTest 3: Onay sonrası başarılı Giriş...');
  const loginRes = await request(app)
    .post('/api/login')
    .set('User-Agent', 'bible-appclient')
    .send({
      email: 'ahmetxss@example.com',
      password: 'sifre123'
    });
  console.log('Giriş Testi Durum Kodu:', loginRes.status);
  console.log('Giriş Testi Yanıtı:', loginRes.body);

  // Test 4-8: Bruteforce Engeli Kontrolü (Rate limit)
  console.log('\nTest 4-8: Rate limit (Max 5 istek) testi tetikleniyor...');
  for (let i = 0; i < 6; i++) {
    const loginErrRes = await request(app)
      .post('/api/login')
      .set('User-Agent', 'bible-appclient')
      .send({
        email: 'ahmetxss@example.com',
        password: 'yanlissifre'
      });
    console.log(`Deneme ${i + 1} - Durum Kodu:`, loginErrRes.status, 'Yanıt:', loginErrRes.body);
  }

  // Test 9: Get Catalogs
  console.log('\nTest 9: Katalog öğelerini listeleme...');
  const getCatalogsRes = await request(app)
    .get('/api/catalogs')
    .set('User-Agent', 'bible-appclient');
  console.log('Katalogu Getir Durum Kodu:', getCatalogsRes.status);
  console.log('Katalog listesi:', getCatalogsRes.body);

  // Test 10: Multer ile Görsel Yükleyerek Yeni Katalog Öğesi Ekleme
  console.log('\nTest 10: Multer ile dikey/yatay görsel yükleme ve katalog öğesi ekleme...');
  
  // Create dummy buffers representing images
  const verticalImageBuffer = Buffer.from('fake vertical image content');
  const horizontalImageBuffer = Buffer.from('fake horizontal image content');

  const addCatalogRes = await request(app)
    .post('/api/catalogs')
    .set('User-Agent', 'bible-appclient')
    .field('name', '<h3>Visual Guide Book</h3>') // HTML input to test XSS sanitization as well
    .field('description', 'Kutsal Kitap görsel rehber kitabı')
    .attach('verticalImage', verticalImageBuffer, 'guide_v.png')
    .attach('horizontalImage', horizontalImageBuffer, 'guide_h.jpg');

  console.log('Katalog Ekle Durum Kodu:', addCatalogRes.status);
  console.log('Eklenen Katalog Yanıtı (XSS sanitization & CDN urls):', addCatalogRes.body);

  // Verify that the files were actually written to the uploads directory
  if (addCatalogRes.status === 201) {
    const catalog = addCatalogRes.body.catalog;
    const verticalFilename = catalog.thumbnailVertical.split('/').pop();
    const horizontalFilename = catalog.thumbnailHorizontal.split('/').pop();

    const vPath = path.join(uploadsDir, verticalFilename);
    const hPath = path.join(uploadsDir, horizontalFilename);

    console.log(`Dikey görsel yüklendi mi?: ${fs.existsSync(vPath)} (${verticalFilename})`);
    console.log(`Yatay görsel yüklendi mi?: ${fs.existsSync(hPath)} (${horizontalFilename})`);

    // Clean up created files
    if (fs.existsSync(vPath)) fs.unlinkSync(vPath);
    if (fs.existsSync(hPath)) fs.unlinkSync(hPath);
  }

  // Test 11: List users (GET /api/users)
  console.log('\nTest 11: Kullanıcıları listeleme...');
  const getUsersRes = await request(app)
    .get('/api/users')
    .set('User-Agent', 'bible-appclient');
  console.log('Kullanıcı Listesi Durum Kodu:', getUsersRes.status);
  console.log('Kullanıcı Sayısı:', getUsersRes.body.length);

  // Test 12: Update user (PUT /api/users/:id)
  console.log(`\nTest 12: Kullanıcı güncelleme (ID: ${registeredUserId})...`);
  const updateUserRes = await request(app)
    .put(`/api/users/${registeredUserId}`)
    .set('User-Agent', 'bible-appclient')
    .send({
      firstName: 'Mehmet',
      lastName: 'Demir',
      email: 'mehmet@example.com',
      phoneNumber: '5559876543'
    });
  console.log('Kullanıcı Güncelleme Durum Kodu:', updateUserRes.status);
  console.log('Güncellenen Kullanıcı:', updateUserRes.body.user);

  // Test 13: List payments (GET /api/payments)
  console.log('\nTest 13: Ödemeleri listeleme...');
  const getPaymentsRes = await request(app)
    .get('/api/payments')
    .set('User-Agent', 'bible-appclient');
  console.log('Ödeme Listesi Durum Kodu:', getPaymentsRes.status);
  console.log('Ödeme Sayısı:', getPaymentsRes.body.length);

  // Test 14: Add notification (POST /api/notifications)
  console.log('\nTest 14: Bildirim gönderme...');
  const addNotifRes = await request(app)
    .post('/api/notifications')
    .set('User-Agent', 'bible-appclient')
    .send({
      title: 'Yükleme Tamamlandı',
      message: 'Yeni görsel kitap yüklendi.',
      type: 'success',
      sentTo: 'all'
    });
  console.log('Bildirim Ekleme Durum Kodu:', addNotifRes.status);
  console.log('Eklenen Bildirim:', addNotifRes.body.notification);

  // Test 15: List notifications (GET /api/notifications)
  console.log('\nTest 15: Bildirimleri listeleme...');
  const getNotifsRes = await request(app)
    .get('/api/notifications')
    .set('User-Agent', 'bible-appclient');
  console.log('Bildirim Listesi Durum Kodu:', getNotifsRes.status);
  console.log('Bildirim Sayısı:', getNotifsRes.body.length);

  // Test 16: Delete notification (DELETE /api/notifications/:id)
  console.log('\nTest 16: Bildirimi silme...');
  const deleteNotifRes = await request(app)
    .delete(`/api/notifications/${addNotifRes.body.notification.id}`)
    .set('User-Agent', 'bible-appclient');
  console.log('Bildirim Silme Durum Kodu:', deleteNotifRes.status);

  // Test 17: Delete user (DELETE /api/users/:id)
  console.log(`\nTest 17: Kullanıcı silme (ID: ${registeredUserId})...`);
  const deleteUserRes = await request(app)
    .delete(`/api/users/${registeredUserId}`)
    .set('User-Agent', 'bible-appclient');
  console.log('Kullanıcı Silme Durum Kodu:', deleteUserRes.status);
  
  console.log('\n--- TÜM ENTEGRASYON TESTLERİ TAMAMLANDI ---');
  process.exit(0);
}

runTests().catch(console.error);
