import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

const KEYS = {
  symbol: ['symbol','token','asset','ticker','pair','coin','name'],
  size:   ['size','amount','qty','quantity','balance','position','holdings'],
  price:  ['avgprice','price','entry','cost','entryprice','avg'],
  pnl:    ['pnl','profit','unrealized','u_pnl','upnl','p/l']
};

const lc = s => (s ?? '').toString().toLowerCase();
const clean = t => (t ?? '').toString().replace(/\s+/g,' ').trim();

function scoreObjectKeys(obj) {
  const keys = Object.keys(obj).map(lc);
  let s = 0;
  if (keys.some(k => KEYS.symbol.includes(k))) s += 3;
  if (keys.some(k => KEYS.size.some(x => k.includes(x)))) s += 2;
  if (keys.some(k => KEYS.price.some(x => k.includes(x)))) s += 2;
  if (keys.some(k => KEYS.pnl.some(x => k.includes(x)))) s += 1;
  return s;
}

function pickField(obj, list) {
  for (const k of Object.keys(obj)) {
    const lk = lc(k);
    if (list.includes(lk) || list.some(x => lk.includes(x))) return obj[k];
  }
  return '';
}

function mapRow(o) {
  return {
    symbol: clean(pickField(o, KEYS.symbol)),
    size:   String(pickField(o, KEYS.size) ?? ''),
    avgPrice: String(pickField(o, KEYS.price) ?? ''),
    pnl:    String(pickField(o, KEYS.pnl) ?? '')
  };
}

function flattenArrays(json) {
  const out = [];
  (function walk(x) {
    if (!x) return;
    if (Array.isArray(x)) {
      out.push(x);
      x.forEach(walk);
    } else if (typeof x === 'object') {
      Object.values(x).forEach(walk);
    }
  })(json);
  return out;
}

async function dump(page, name='') {
  if (!CONFIG.DEBUG_DUMP) return;
  const dir = path.join(process.cwd(), 'dumps');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `dump${name?'-'+name:''}-${Date.now()}.html`), await page.content());
  await page.screenshot({ path: path.join(dir, `shot${name?'-'+name:''}-${Date.now()}.png`), fullPage: true }).catch(()=>{});
}

async function sniffJSON(page, millis=9000) {
  const dir = path.join(process.cwd(), 'dumps');
  fs.mkdirSync(dir, { recursive: true });
  const seen = [];
  page.on('response', async (res) => {
    try {
      const ct = res.headers()['content-type'] || '';
      if (!ct.includes('application/json')) return;
      const url = res.url();
      const bodyText = await res.text();
      // dosyaya da yaz (debug için)
      if (CONFIG.DEBUG_DUMP) {
        const file = path.join(dir, `net-${Date.now()}.json`);
        fs.writeFileSync(file, JSON.stringify({ url, status: res.status(), body: bodyText.slice(0, 200000) }, null, 2));
      }
      const body = JSON.parse(bodyText);
      seen.push(body);
    } catch {}
  });
  await page.waitForTimeout(millis);
  return seen;
}

async function tryDOM(page) {
  const selectors = [
    CONFIG.ROW_SELECTOR,
    'table tbody tr',
    'table tr',
    '[role="row"]'
  ];
  for (const sel of selectors) {
    try {
      const rows = await page.$$eval(sel, trs => {
        function c(t){ return (t??'').toString().replace(/\s+/g,' ').trim(); }
        const out = [];
        for (let i=0;i<trs.length;i++){
          const tds = Array.from(trs[i].querySelectorAll('td,[role="gridcell"]'));
          if (!tds.length) continue;
          out.push(tds.map(td => c(td.textContent)));
        }
        return out;
      });
      if (rows?.length) {
        let mapped = rows.map(cols => ({ symbol: cols[0]||'', size: cols[1]||'', avgPrice: cols[2]||'', pnl: cols[3]||'' }));
        if (mapped.length && /symbol|size/i.test(mapped[0].symbol + mapped[0].size)) mapped.shift();
        mapped = mapped.filter(r => r.symbol && r.symbol !== '-');
        if (mapped.length) return mapped;
      }
    } catch {}
  }
  return [];
}

export async function fetchPositions() {
  const browser = await chromium.launch({ headless: CONFIG.HEADLESS, args: ['--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(CONFIG.MODEL_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  // olası sekme tuşları
  for (const t of ['POSITIONS','Positions','Portfolio','Holdings']) {
    const el = await page.$(`text=${t}`);
    if (el) { await el.click().catch(()=>{}); await page.waitForTimeout(600); }
  }

  await dump(page, 'open');

  // 1) JSON sniff
  const payloads = await sniffJSON(page, 9000);
  let best = [];
  let bestScore = 0;
  for (const p of payloads) {
    for (const arr of flattenArrays(p)) {
      if (!Array.isArray(arr) || !arr.length || typeof arr[0] !== 'object') continue;
      const s = scoreObjectKeys(arr[0]);
      if (s > bestScore) {
        best = arr.map(mapRow).filter(r => r.symbol);
        bestScore = s;
      }
    }
  }
  if (best.length) { await browser.close(); return best; }

  // 2) DOM fallback
  let dom = await tryDOM(page);
  if (!dom.length) {
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(800);
    await dump(page, 'scrolled');
    dom = await tryDOM(page);
  }

  await browser.close();
  return dom;
}
