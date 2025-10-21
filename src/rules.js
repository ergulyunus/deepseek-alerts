// src/rules.js
import { CONFIG } from './config.js';

const toNum = (s) => {
  if (s == null) return NaN;
  const m = String(s).match(/-?\d+(\.\d+)?/g);
  return m ? Number(m.join('')) : NaN;
};
const pctFromStr = (s) => {
  // "12.3%" -> 12.3 , "-5 %" -> -5
  if (s == null) return NaN;
  const hasPct = String(s).includes('%');
  if (!hasPct) return NaN;
  const n = toNum(s);
  return isNaN(n) ? NaN : n;
};

function indexBySymbol(list=[]) {
  const map = new Map();
  for (const r of list) if (r?.symbol) map.set(r.symbol, r);
  return map;
}

export function evaluateAlerts(oldList=[], newList=[]) {
  const events = [];
  const oldMap = indexBySymbol(oldList);
  const newMap = indexBySymbol(newList);

  // 1) Yeni eklenenler
  if (CONFIG.ALERT_ON_NEW !== false && String(process.env.ALERT_ON_NEW||'true')==='true') {
    for (const [sym, cur] of newMap) {
      if (!oldMap.has(sym)) {
        events.push({ type: 'NEW_SYMBOL', symbol: sym, msg: `${sym} portföye eklendi`, current: cur });
      }
    }
  }

  // 2) Çıkanlar
  if (CONFIG.ALERT_ON_EXIT !== false && String(process.env.ALERT_ON_EXIT||'true')==='true') {
    for (const [sym, prev] of oldMap) {
      if (!newMap.has(sym)) {
        events.push({ type: 'EXIT_SYMBOL', symbol: sym, msg: `${sym} pozisyonu kapatıldı/çıktı`, previous: prev });
      }
    }
  }

  // 3) PnL eşiklerine göre
  const upThresh = Number(process.env.PNL_UP_PCT ?? 9999);
  const dnThresh = Number(process.env.PNL_DOWN_PCT ?? -9999);
  for (const [sym, cur] of newMap) {
    const prev = oldMap.get(sym);
    const curPct = pctFromStr(cur?.pnl);
    const prevPct = pctFromStr(prev?.pnl);

    if (!isNaN(curPct)) {
      if (!isNaN(upThresh) && curPct >= upThresh && (isNaN(prevPct) || prevPct < upThresh)) {
        events.push({ type: 'PNL_UP', symbol: sym, msg: `${sym} PnL %${curPct.toFixed(2)} (≥ ${upThresh}%)`, current: cur, previous: prev });
      }
      if (!isNaN(dnThresh) && curPct <= dnThresh && (isNaN(prevPct) || prevPct > dnThresh)) {
        events.push({ type: 'PNL_DOWN', symbol: sym, msg: `${sym} PnL %${curPct.toFixed(2)} (≤ ${dnThresh}%)`, current: cur, previous: prev });
      }
    }
  }

  // 4) Size değişimi
  const sizeDeltaPct = Number(process.env.SIZE_DELTA_PCT ?? 9999);
  for (const [sym, cur] of newMap) {
    const prev = oldMap.get(sym);
    if (!prev) continue;
    const s0 = toNum(prev.size), s1 = toNum(cur.size);
    if (isNaN(s0) || isNaN(s1) || !s0) continue;
    const change = ((s1 - s0) / Math.abs(s0)) * 100;
    if (Math.abs(change) >= sizeDeltaPct) {
      const dir = change > 0 ? 'arttı' : 'azaldı';
      events.push({ type: 'SIZE_CHANGE', symbol: sym, msg: `${sym} size %${change.toFixed(1)} ${dir}`, deltaPct: change, current: cur, previous: prev });
    }
  }

  return events;
}