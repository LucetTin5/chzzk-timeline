import 'dotenv/config';
import cron from 'node-cron';
import { scanChannels } from './scrape.js';
import { uploadKv } from './upload.js';

// cron.schedule(process.env.CRON_SCRAPER, () => {
scanChannels();
// });

// cron.schedule(process.env.CRON_UPLOADER, () => {
//   uploadKv();
// });
