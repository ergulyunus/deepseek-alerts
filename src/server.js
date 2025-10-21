// src/server.js
import express from 'express';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

import { CONFIG } from './config.js';
import { fetchPositions } from './fetcher.js';
import { readStore, writeStore, ensureStore } from './storage.js';
import { notifyChange } from './notifier.js';
import { evaluateAlerts } from './rules.js'; // <- uyarı kuralları

const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ensureStore();

/** Basit diff: eski/yeni listelerdeki eklenen-çıkan/değişen satırları bulur */
function diffPositions(oldList, newList) {
  const keyOf = (r) => r.symbol;
  const oldMap = new Map((oldList || []).map(x => [keyOf(x), x]));
  const newMap = new Map((newList || []).map(x => [keyOf(x), x]));

  const added = [];
  const removed = [];
  const changed = [];

  for (const [k, v] of newMap) {
    if (!oldMap.has(k)) {
      added.push(v);
    } else {
      const prev = oldMap.get(k);
      if (JSON.stringify(prev) !== JSON.stringify(v)) {
        changed.push({ before: prev, after: v });
      }
    }
  }
  for (const [k, v] of oldMap) {
    if (!newMap.has(k)) removed.push(v);
  }
  return { added, removed, changed };
}

// Son üretilen uyarıları /events için bellekte tutuyoruz
let LAST_EVENTS = [];

/** Tek seferlik yenileme */
async function refreshOnce() {
  logger.info('Fetching positions...');
  const store = readStore(); // { positions, updatedAt }

  // 1) Veriyi çek
  const list = await fetchPositions();

  // 2) Diff + kurallar
  const diffs = diffPositions(store.positions || [], list);
  const alerts = evaluateAlerts(store.positions || [], list);
  LAST_EVENTS = alerts;

  // 3) Kaydet
  const updatedAt = Date.now();
  writeStore({ positions: list, updatedAt });

  // 4) Değişim veya uyarı varsa webhook’a gönder
  if (diffs.added.length || diffs.removed.length || diffs.changed.length || alerts.length) {
    logger.info({ ...diffs, alertsCount: alerts.length }, 'Change/Alerts');
    await notifyChange({
      source: 'nof1/deepseek',
      updatedAt,
      diffs,
      alerts
    });
  } else {
    logger.info('No change');
  }

  return { positions: list, updatedAt, diff: diffs, alerts };
}

/* ---------- REST endpoints ---------- */

// Son kayıtlı pozisyonlar (diskten)
app.get('/positions', (req, res) => {
  res.json(readStore());
});

// Anlık yenile ve sonucu döndür
app.post('/refresh', async (req, res) => {
  try {
    const result = await refreshOnce();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Son uyarılar (server belleğinde)
app.get('/events', (req, res) => {
  res.json({ events: LAST_EVENTS, at: Date.now() });
});

// Statik web arayüzü
app.use('/', express.static(path.join(__dirname, '..', 'public')));

/* ---------- Cron (interval ms) ---------- */
let timer = null;
function startCron() {
  clearInterval(timer);
  timer = setInterval(() => {
    refreshOnce().catch(err => logger.error(err, 'refresh error'));
  }, CONFIG.CRON_EVERY_MS);
  logger.info('Cron started every ' + CONFIG.CRON_EVERY_MS + ' ms');
}

// Sunucu
app.listen(CONFIG.PORT, () => {
  logger.info('Server listening on http://localhost:' + CONFIG.PORT);
  startCron();
});
