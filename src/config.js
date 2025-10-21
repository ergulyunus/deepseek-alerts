import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  MODEL_URL: process.env.MODEL_URL || 'https://nof1.ai/arena/deepseek',
  ROW_SELECTOR: process.env.ROW_SELECTOR || 'table tbody tr',
  COL_SYMBOL: Number(process.env.COL_SYMBOL ?? 0),
  COL_SIZE: Number(process.env.COL_SIZE ?? 1),
  COL_AVG_PRICE: Number(process.env.COL_AVG_PRICE ?? 2),
  COL_PNL: Number(process.env.COL_PNL ?? 3),
  CRON_EVERY_MS: Number(process.env.CRON_EVERY_MS ?? 60000),
  WEBHOOK_URL: process.env.WEBHOOK_URL || '',
  PORT: Number(process.env.PORT ?? 8787),
  HEADLESS: (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false',
  DEBUG_DUMP: (process.env.DEBUG_DUMP ?? '0') === '1',
};
