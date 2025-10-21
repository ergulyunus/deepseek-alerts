# 📈 DeepSeek Alerts

**DeepSeek Alerts**, [nof1.ai](https://nof1.ai) üzerindeki **DeepSeek model pozisyonlarını** otomatik takip eden, al/sat uyarıları üreten ve görsel bir web panelinde gösteren açık kaynaklı bir araçtır.  

---

## 🚀 Özellikler
- 🔎 **Pozisyon Takibi**: DeepSeek sayfasından Playwright ile pozisyonları çeker  
- ⚡ **Gerçek Zamanlı Uyarılar**  
  - ✅ Yeni coin eklendiğinde  
  - ❌ Coin pozisyondan çıktığında  
  - 📊 PnL (kar/zarar) eşikleri aşıldığında  
  - 📦 Pozisyon miktarı (size) belirli oranda değiştiğinde  
- 🎨 **Web Paneli**  
  - Sağ panelde AL (yeşil), SAT (kırmızı), WARN (sarı) kutuları  
  - Sesli bildirimler (AL için pozitif bip, SAT için düşük ton, WARN için kısa uyarı)  
  - Otomatik 10 sn yenileme (isteğe bağlı)  
- 🌐 **Webhook** desteği: Uyarılar harici sistemlere POST edilebilir  
- 🔒 Güvenli: `.env` ve `data/positions.json` GitHub’a gönderilmez  

---

## 📸 Ekran Görüntüsü

> Buraya uygulamanın ekran görüntüsü veya gifini ekleyebilirsin 👇

![DeepSeek Alerts UI](docs/screenshot.png)

---

## 🛠️ Kurulum

### 1. Depoyu klonla
```bash
git clone https://github.com/ergulyunus/deepseek-alerts.git
cd deepseek-alerts
```

### 2. Bağımlılıkları kur
```bash
npm install
npx playwright install
```

### 3. Ortam dosyasını ayarla
```bash
cp .env.sample .env
```
`.env` dosyasında eşikleri ve ayarları düzenle.

### 4. Çalıştır
```bash
npm run dev
```

Arayüz: [http://localhost:8787](http://localhost:8787)  
- `/positions` → JSON pozisyonlar  
- `/events` → JSON uyarılar  

---

## ⚙️ .env Ayarları (örnek)

```ini
MODEL_URL=https://nof1.ai/arena/deepseek
PORT=8787
CRON_EVERY_MS=60000

# Uyarılar
ALERT_ON_NEW=true
ALERT_ON_EXIT=true
PNL_UP_PCT=2
PNL_DOWN_PCT=-1
ABS_PNL_UP=0.5
ABS_PNL_DOWN=-0.5
SIZE_DELTA_PCT=5

# Debug
HEADLESS=false
DEBUG_DUMP=1
ROW_SELECTOR=table tbody tr

# Webhook (opsiyonel)
WEBHOOK_URL=
```

---

## 📊 Kullanım Senaryosu
- ✅ AL → Yeni coin / kâr artışı  
- ❌ SAT → Pozisyondan çıkış / zarar  
- ⚠️ WARN → Size değişimi  

---

## 📜 Lisans
MIT Lisansı altında yayımlanmıştır.  
