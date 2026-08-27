import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/images');

async function captureSubmittedScreen() {
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
    await new Promise((r) => setTimeout(r, 800));

    // Click "To'liq Ekranga Kirish va Boshlash"
    const fsBtns = await page.$$('button');
    for (const b of fsBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes("To'liq Ekranga")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));

    // Answer first question
    const optionBtns = await page.$$('button');
    for (const opt of optionBtns) {
      const txt = await page.evaluate(el => el.textContent, opt);
      if (txt && (txt.includes("To'g'ri") || txt.startsWith('A)') || txt.includes('<p>'))) {
        await opt.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    // Open finish dialog
    const headerBtns = await page.$$('button');
    for (const b of headerBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes('Imtihonni yakunlash')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_yakunlash_tasdiqlash_oynasi.png') });

    // Click "Ha, yakunlash"
    const modalBtns = await page.$$('button');
    for (const b of modalBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes('Ha, yakunlash')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_natijalar_yakuniy_sahifa.png') });

    console.log('Done capturing submitted screen!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureSubmittedScreen();
