# BibleCMS API Kullanım Kılavuzu

Tüm isteklere eklenecek ortak başlıklar (Headers):
- Content-Type: application/json
- User-Agent: bible-appclient

---

## 1. Kayıt Ol (Register)

POST http://bible-api:8787/api/register

```javascript
fetch('http://bible-api:8787/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'bible-appclient'
  },
  body: JSON.stringify({
    firstName: "Ahmet",
    lastName: "Yılmaz",
    email: "ahmet@example.com",
    phoneNumber: "5551234567",
    password: "sifre123"
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 2. Giriş Yap (Login)

POST http://bible-api:8787/api/login

```javascript
fetch('http://bible-api:8787/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'bible-appclient'
  },
  body: JSON.stringify({
    email: "ahmet@example.com",
    password: "sifre123"
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 3. Katalog Öğelerini Listele (Get Catalogs)

GET http://bible-api:8787/api/catalogs

```javascript
fetch('http://bible-api:8787/api/catalogs', {
  method: 'GET',
  headers: {
    'User-Agent': 'bible-appclient'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 4. Katalog Öğesi Ekle (Add Catalog Item - Multer Multipart Yükleme)

POST http://bible-api:8787/api/catalogs

Görsel dosyalarını `multipart/form-data` formatında yüklemek için `FormData` nesnesi kullanılır:

```javascript
const formData = new FormData();
formData.append('name', 'Visual Guide Book');
formData.append('description', 'Kutsal Kitap görsel rehber kitabı');
// fileInputVertical ve fileInputHorizontal HTML input elementleridir (type="file")
formData.append('verticalImage', fileInputVertical.files[0]);
formData.append('horizontalImage', fileInputHorizontal.files[0]);

fetch('http://bible-api:8787/api/catalogs', {
  method: 'POST',
  headers: {
    'User-Agent': 'bible-appclient'
    // Dikkat: FormData kullanırken 'Content-Type' başlığı el ile ayarlanmaz. 
    // Tarayıcı otomatik olarak 'boundary' değeriyle birlikte ayarlar.
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```
