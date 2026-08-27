import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/images');

async function captureResultsAndAll() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      const testGroups = [
        {
          id: 'group_frontend_01',
          group_name: 'Frontend Dasturlash (Test)',
          group_code: 'FRONTEND-01',
          counts: { HTML: 5, CSS: 5, JavaScript: 5, Python: 5 },
          duration_minutes: 60,
          max_students: 30,
          is_active: true
        }
      ];
      localStorage.setItem('monday_exam_groups_cache_v2', JSON.stringify(testGroups));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    await page.type('input[placeholder="Ismingizni kiriting"]', 'Alisher');
    await page.type('input[placeholder="Familiyangizni kiriting"]', 'Navoiy');
    await page.type('input[placeholder="Guruh kodini kiriting..."]', 'FRONTEND-01');

    await page.waitForFunction(() => document.body.innerText.includes('Frontend Dasturlash'));
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1000));

    // Click start exam
    const startBtns = await page.$$('button');
    for (const b of startBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && (txt.includes('Boshlash') || txt.includes('Kirish') || txt.includes('Davom etish'))) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));

    // Click finish exam in top header
    console.log('Clicking finish exam header button...');
    const headerBtns = await page.$$('button');
    for (const b of headerBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes('Imtihonni yakunlash')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_yakunlash_tasdiqlash_modal.png') });

    // Click "Ha, yakunlayman" inside the modal
    console.log('Confirming exam submission in modal...');
    const modalBtns = await page.$$('button');
    for (const b of modalBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && (txt.includes('Ha, yakunlayman') || txt.includes('Yakunlash'))) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_natijalar_sahifasi.png') });

    console.log('Results screenshot captured successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureResultsAndAll();
