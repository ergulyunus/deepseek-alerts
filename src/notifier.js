import axios from 'axios';
import { CONFIG } from './config.js';

export async function notifyChange(payload) {
  if (!CONFIG.WEBHOOK_URL) return;
  try {
    await axios.post(CONFIG.WEBHOOK_URL, payload, { timeout: 10000 });
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
}
