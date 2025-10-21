import fs from 'fs';
import path from 'path';
const dataPath = path.join(process.cwd(), 'data');
const file = path.join(dataPath, 'positions.json');

export function ensureStore() {
  if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ positions: [], updatedAt: 0 }, null, 2));
}

export function readStore() {
  ensureStore();
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw);
}

export function writeStore(obj) {
  ensureStore();
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}
