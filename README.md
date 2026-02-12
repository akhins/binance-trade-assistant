# 📈 Binance Trade Asistanı

> Daha çok değil, **daha iyi trade** — AI destekli risk yönetimi ve trade analizi

Binance Trade Asistanı, kripto para işlemlerinizi analiz etmenize, disiplinli kalmanıza ve performansınızı ölçülebilir şekilde iyileştirmenize yardımcı olan modern bir web uygulamasıdır.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)
![Binance](https://img.shields.io/badge/Binance-Testnet-F0B90B?logo=binance)

---

## 🎯 Amaç ve Nasıl Çalışır?

### Ne Yapar?

Bu uygulama bir **trading botu değildir**. Sizin adınıza işlem açmaz veya kapatmaz. Amacı:

1. **Veri toplama** — Binance hesabınızdan trade geçmişinizi güvenli şekilde senkronize eder
2. **Risk kontrolü** — Günlük/haftalık kayıp limitleri, maksimum işlem sayısı gibi kurallarla disiplin modu sunar
3. **Performans analizi** — Win rate, profit factor, drawdown gibi metriklerle performansınızı özetler
4. **AI öneriler** — Google Gemini ile haftalık raporlar ve davranışsal öneriler üretir

### Nasıl Çalışır?

```
┌─────────────┐     API Bağlantısı      ┌──────────────┐
│   Binance   │ ◄──────────────────────► │   Uygulama   │
│  (Testnet)  │     (şifreli saklama)    │  (Yerel)     │
└─────────────┘                          └──────┬───────┘
                                                │
                                                ▼
                                        ┌──────────────┐
                                        │  JSON DB     │
                                        │  (data/)     │
                                        └──────────────┘
```

- **Binance API** ile hesabınıza sadece okuma ve trade geçmişi erişimi
- **API anahtarları** AES-256 ile şifrelenerek yerel veritabanında saklanır
- **Tüm veriler** bilgisayarınızda kalır; sunucuya gönderilmez (AI raporları için sadece özet veri Gemini API'ye gider)

---

## ✨ Özellikler

| Özellik | Açıklama |
|--------|----------|
| 📊 **Dashboard** | Toplam PnL, win rate, profit factor, expectancy, dönemsel performans |
| 📋 **Trade Listesi** | Tüm işlemlerinizi görüntüleme, filtreleme (Açık/Kapalı), Binance senkronizasyonu |
| 🛡️ **Risk Yönetimi** | Günlük/haftalık kayıp limiti, max işlem sayısı, ardışık kayıp uyarısı |
| 🔒 **Disiplin Modu** | Limit aşıldığında uyarı ve bilgilendirme |
| 🤖 **AI Raporlar** | Haftalık performans analizi, öneriler ve alışkanlık tespiti (Gemini) |
| ⚙️ **Ayarlar** | Binance API bağlantısı, veri yönetimi |

---

## 🚀 Kurulum

### Gereksinimler

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm** veya yarn

### Hızlı Başlangıç

```bash
# 1. Projeyi klonlayın
git clone https://github.com/akhins/binance-trade-assistant.git
cd binance-trade-assistant

# 2. Bağımlılıkları yükleyin
npm install

# 3. Ortam değişkenlerini ayarlayın
cp .env.example .env.local
# .env.local dosyasını düzenleyin (aşağıya bakın)

# 4. Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcıda açın: **http://localhost:3000**

### Ortam Değişkenleri (`.env.local`)

```env
# Binance Testnet (varsayılan)
BINANCE_API_URL=https://testnet.binance.vision
BINANCE_WS_URL=wss://testnet.binance.vision/ws

# Google Gemini AI (zorunlu - raporlar için)
GEMINI_API_KEY=your_gemini_api_key_here

# Güvenlik (32+ karakter)
ENCRYPTION_SECRET=your_random_32_character_secret_key

# Uygulama
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Gemini API Key:** [Google AI Studio](https://makersuite.google.com/app/apikey) → Create API Key

---

## 📱 Kullanım

### 1. Binance Bağlantısı

1. **Ayarlar** sayfasına gidin
2. Binance **Testnet** API Key ve Secret girin
   - [Binance Testnet](https://testnet.binance.vision/) üzerinden hesap açın
   - API oluştururken **Read** ve **Trade** izinleri yeterli — **Withdraw vermeyin**

### 2. Trade Senkronizasyonu

1. **Trade'ler** sayfasında **Binance'ten Senkronize Et** butonuna tıklayın
2. Trade geçmişiniz yerel veritabanına aktarılır

### 3. Risk Kuralları

1. **Risk** sayfasında günlük/haftalık limitlerinizi ayarlayın
2. Limit aşıldığında uyarı alırsınız

### 4. AI Raporları

1. **AI Raporlar** sayfasında **Yeni Rapor Oluştur** ile haftalık analiz alın
2. Gemini API key'inizin `.env.local`'de tanımlı olduğundan emin olun

---

## 🛠 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Veritabanı | JSON dosya tabanlı (data/db.json) |
| AI | Google Gemini API |
| Kripto | Binance API (binance-api-node) |
| Şifreleme | CryptoJS (AES-256) |

---

## 📁 Proje Yapısı

```
binance-trade-assistant/
├── app/
│   ├── api/              # API rotaları
│   ├── components/       # Navbar vb.
│   ├── dashboard/        # Ana panel
│   ├── trades/           # Trade listesi
│   ├── risk/             # Risk yönetimi
│   ├── reports/          # AI raporları
│   └── settings/         # Ayarlar
├── lib/
│   ├── ai/               # Gemini, pattern detection
│   ├── analytics/        # Metrik hesaplamaları
│   ├── binance/          # API client, trade sync
│   ├── db/               # Veritabanı
│   ├── risk/             # Risk kuralları
│   └── security/         # Şifreleme
├── data/                 # db.json (otomatik oluşur)
└── .env.local            # Ortam değişkenleri (siz oluşturursunuz)
```

---

## 🔒 Güvenlik

- API anahtarları **AES-256** ile şifrelenir
- `.env.local` ve `data/` Git'e **eklenmez**
- Uygulama sizin adınıza **işlem açmaz** — sadece okuma ve analiz
- Binance **Testnet** varsayılandır; gerçek para riski yoktur

---

## ⚠️ Önemli Notlar

- **MVP** — Production için ek test ve güvenlik önlemleri önerilir
- **Testnet** — Gerçek Binance hesabı için ayarları değiştirmeniz gerekir
- **Gemini API** — Ücretsiz kotası vardır; yoğun kullanımda maliyet oluşabilir

---

## 📄 Lisans

MIT License — İstediğiniz gibi kullanabilir ve geliştirebilirsiniz.

---

<p align="center">
  <strong>Bu asistan bir bot değildir.</strong><br>
  Tüm trading kararları size aittir. Asistan sadece veri sağlar ve disiplinde kalmanıza yardımcı olur.
</p>
