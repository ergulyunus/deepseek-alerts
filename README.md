# DeepSeek Alerts v2 — Daha Dayanıklı Scraper + Debug

**Yenilikler**
- Otomatik selektör denemeleri: `ROW_SELECTOR` → `table tbody tr` → `table tr`
- İlk satır başlık ise otomatik atlama
- `DEBUG_DUMP=1` iken sayfa HTML'i `dumps/` klasörüne kaydedilir
- `HEADLESS=false` ile tarayıcıyı görünür çalıştırabilirsiniz (Playwright)
- Ayrıntılı log

## Hızlı Kurulum
```bash
npm install
npx playwright install
cp .env.sample .env
npm run dev
```

`.env` içinden **MODEL_URL**'i doğru sayfaya ayarlayın. Boş geldiyse:
- `ROW_SELECTOR=table tbody tr` yapın.
- `HEADLESS=false` ve `DEBUG_DUMP=1` ile çalıştırıp hangi tabloda veri olduğunu görün.
- Loglarda "Selector tried" satırlarına bakın.

## Komutlar
- `npm run dev` — nodemon ile canlı
- `npm start` — prod
