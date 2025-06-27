# 🏳️ Bayrak Bulma Oyunu

Ülke bayraklarını tanıma ve çoklu oyuncu desteği olan eğlenceli bir web oyunu.

## 🎮 Oyun Özellikleri

- **Çoklu Oyuncu Desteği**: İki kişi aynı anda oynayabilir
- **Gerçek Zamanlı Oyun**: Socket.IO ile anlık iletişim
- **10 Tur Oyun**: Her oyunda 10 farklı ülke bayrağı
- **Puan Sistemi**: Doğru cevap + hız bonusu
- **Modern Tasarım**: Responsive ve kullanıcı dostu arayüz
- **200+ Ülke**: Dünya genelinden ülke bayrakları

## 🚀 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd bayrak-bulma-oyunu
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Uygulamayı başlatın**
```bash
# Geliştirme modu
npm run dev

# Prodüksiyon modu
npm start
```

4. **Tarayıcıda açın**
```
http://localhost:3000
```

## 🎯 Nasıl Oynanır

### Oda Oluşturma
1. Ana sayfada "Oda Oluştur" seçeneğini tıklayın
2. Oyuncu adınızı girin
3. Oda oluşturun ve size verilen kodu arkadaşınızla paylaşın

### Odaya Katılma
1. Ana sayfada "Odaya Katıl" seçeneğini tıklayın
2. Oyuncu adınızı ve oda kodunu girin
3. Odaya katılın

### Oyun Kuralları
- Her turda bir ülke bayrağı gösterilir
- 4 seçenek arasından doğru ülkeyi seçin
- Doğru cevap: 10 puan
- Hız bonusu: 0-10 puan (ne kadar hızlı cevap verirseniz o kadar çok bonus)
- 10 tur sonunda en yüksek puanı alan oyuncu kazanır

## 🛠️ Teknolojiler

### Backend
- **Node.js**: Sunucu tarafı JavaScript runtime
- **Express.js**: Web framework
- **Socket.IO**: Gerçek zamanlı iletişim
- **UUID**: Benzersiz oda ID'leri

### Frontend
- **HTML5**: Yapısal markup
- **CSS3**: Modern styling ve animasyonlar
- **JavaScript (ES6+)**: İstemci tarafı mantık
- **Font Awesome**: İkonlar
- **Google Fonts**: Typography

## 📁 Proje Yapısı

```
bayrak-bulma-oyunu/
├── public/
│   ├── index.html      # Ana HTML sayfası
│   ├── style.css       # CSS stilleri
│   └── script.js       # İstemci JavaScript
├── server.js           # Express ve Socket.IO sunucusu
├── package.json        # Proje bağımlılıkları
└── README.md          # Bu dosya
```

## 🌐 Deployment

### Heroku
```bash
# Heroku CLI ile
heroku create your-app-name
git push heroku main
```

### Vercel
```bash
# Vercel CLI ile
vercel
```

### Railway
```bash
# Railway CLI ile
railway login
railway init
railway up
```

## 🔧 Konfigürasyon

### Environment Variables
```env
PORT=3000              # Sunucu portu (varsayılan: 3000)
NODE_ENV=production    # Ortam (development/production)
```

### Özelleştirme
- `server.js` dosyasında ülke listesini düzenleyebilirsiniz
- `public/style.css` dosyasında tasarımı özelleştirebilirsiniz
- `public/script.js` dosyasında oyun mantığını değiştirebilirsiniz

## 🎨 Özellikler

### Responsive Tasarım
- Mobil cihazlarda mükemmel görünüm
- Tablet ve desktop uyumlu
- Touch-friendly arayüz

### Gerçek Zamanlı Özellikler
- Anlık oyuncu girişi/çıkışı
- Canlı skor güncellemeleri
- Senkronize oyun akışı

### Kullanıcı Deneyimi
- Sezgisel navigasyon
- Görsel geri bildirimler
- Hata yönetimi
- Loading animasyonları

## 🐛 Sorun Giderme

### Yaygın Sorunlar

1. **Port zaten kullanımda**
```bash
# Farklı port kullanın
PORT=3001 npm start
```

2. **Socket.IO bağlantı hatası**
- Firewall ayarlarını kontrol edin
- Proxy ayarlarını kontrol edin

3. **Oda bulunamadı**
- Oda kodunu doğru girdiğinizden emin olun
- Odanın hala aktif olduğunu kontrol edin

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 👥 Geliştirici

Bu proje eğitim amaçlı geliştirilmiştir.

## 🔗 Bağlantılar

- [Demo](https://your-app-url.herokuapp.com)
- [GitHub Repository](https://github.com/your-username/bayrak-bulma-oyunu)
- [Issue Tracker](https://github.com/your-username/bayrak-bulma-oyunu/issues)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! 