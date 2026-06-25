# AWS CloudShell ile S3 ve IAM Kurulum Rehberi (Step-by-Step)

Bu rehber, AWS Management Console üzerindeki **AWS CloudShell**'i (tarayıcı tabanlı terminal) kullanarak S3 bucket oluşturma, izinleri yapılandırma, IAM kullanıcısı tanımlama ve API erişim anahtarları (Access & Secret Key) alma işlemlerini en hızlı ve kolay şekilde yapmanızı sağlar.

---

## Adım 1: AWS CloudShell'i Başlatın
1. AWS Management Console'a giriş yapın.
2. Ekranın sağ üst köşesindeki **CloudShell** simgesine (siyah renkli terminal simgesi `>_`) tıklayın.
3. Terminalin hazır hale gelmesini bekleyin (birkaç saniye sürebilir).

---

## Adım 2: S3 Kova (Bucket) Yapılandırma

Bu proje için kullanılacak bucket:
- **Bucket name:** `biblecms-media-2026-app`
- **Region:** `us-east-1`
- **Folder/prefix:** `kidsbible-content/`

### 1. Public erişim ayarı
Eğer medya dosyalarını doğrudan URL ile göstereceksen:
- `Block all public access` kapalı olmalı
- Bucket policy ile yalnızca `kidsbible-content/*` okuma izni vermelisin

### 2. Public read policy
AWS Console > S3 > `biblecms-media-2026-app` > `Permissions` > `Bucket policy` alanına şu içeriği koy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadKidsBibleContent",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::biblecms-media-2026-app/kidsbible-content/*"
    }
  ]
}
```

### 3. Browser direct upload için CORS
Admin panel presigned URL ile doğrudan S3'e `PUT` yaptığı için bucket CORS zorunludur.

AWS CLI ile:
```bash
aws s3api put-bucket-cors \
  --bucket biblecms-media-2026-app \
  --region us-east-1 \
  --cors-configuration file://aws_bucket_cors.json
```

Kontrol:
```bash
aws s3api get-bucket-cors \
  --bucket biblecms-media-2026-app \
  --region us-east-1
```

---

## Adım 3: IAM Kimlik Bilgilerini Alma ve İzinleri Tanımlama

Sistemin AWS'ye bağlanıp dosya yükleyebilmesi için EC2 instance'a IAM Role bağlanmalıdır. Production'da static access key kullanmayın.

### 1. IAM Role bağlayın
EC2 instance'a S3 yazma/okuma yetkisi olan role bağlayın.

### 2. Uygulama credential'ları otomatik alır
AWS SDK, EC2 metadata üzerinden role credential'larını otomatik alır.

---

## Adım 4: BibleCMS Panelinde Kullanma
1. **BibleCMS Admin Paneli**'ne girin.
2. Sol menüdeki **AWS Upload Panel** sekmesine gidin.
3. Ayarlar alanına aşağıdaki bilgileri girin:
   - **AWS S3 Bucket:** `biblecms-media-2026-app`
   - **AWS Access Key ID:** geçici `AWS_ACCESS_KEY_ID`
   - **AWS Secret Access Key:** geçici `AWS_SECRET_ACCESS_KEY`
   - **AWS Session Token:** geçici `AWS_SESSION_TOKEN`
   - **AWS Region:** `us-east-1`
4. Sağ taraftaki formdan dosyayı seçip **Upload to AWS** butonuna tıklayın. Yükleme tamamlandığında size kopyalamanız için bir S3 URL'si verecektir.

---
*Not: Bilgileri kalıcı olarak sunucuya kaydetmek isterseniz, projenin kök dizinindeki `.env` dosyasına şu şekilde ekleyebilirsiniz:*
```env
AWS_REGION=us-east-1
AWS_S3_BUCKET=biblecms-media-2026-app
AWS_S3_PREFIX=kidsbible-content
```
