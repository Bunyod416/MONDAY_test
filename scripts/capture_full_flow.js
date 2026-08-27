import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/images');

async function captureFullFlow() {
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
    // 1. Initial Registration
    console.log('1. Registration Page...');
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
          is_active: true,
          enforceFullscreen: false
        }
      ];
      localStorage.setItem('monday_exam_groups_cache_v2', JSON.stringify(testGroups));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_royxatdan_otish.png') });

    // 2. Filling Student Name & Group
    console.log('2. Entering details...');
    await page.type('input[placeholder="Ismingizni kiriting"]', 'Alisher');
    await page.type('input[placeholder="Familiyangizni kiriting"]', 'Navoiy');
    await page.type('input[placeholder="Guruh kodini kiriting..."]', 'FRONTEND-01');
    await page.waitForFunction(() => document.body.innerText.includes('Frontend Dasturlash'));
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_guruh_tasdiqlandi.png') });

    // 3. Submit Registration -> Exam directly
    console.log('3. Submitting registration...');
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1200));

    // If fullscreen overlay appears, click button
    const allBtns = await page.$$('button');
    for (const b of allBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes("To'liq Ekranga")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_imtihon_boshlanishi.png') });

    // 4. Answer Question #1
    console.log('4. Selecting answer...');
    const optionBtns = await page.$$('button');
    for (const opt of optionBtns) {
      const txt = await page.evaluate(el => el.textContent, opt);
      if (txt && (txt.includes("To'g'ri") || txt.startsWith('A)') || txt.includes('<p>'))) {
        await opt.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_javob_belgilash.png') });

    // 5. Navigate to CSS tab
    console.log('5. Navigating to CSS tab...');
    const tabBtns = await page.$$('button');
    for (const b of tabBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes('CSS')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_yozma_savol_turi.png') });

    // 6. Click Finish Exam in Header
    console.log('6. Clicking Finish Exam...');
    const headerBtns = await page.$$('button');
    for (const b of headerBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && txt.includes('Imtihonni yakunlash')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_yakunlash_ogohlantirish_modal.png') });

    // 7. Confirm Submission -> Results Page
    console.log('7. Confirming submission...');
    const modalBtns = await page.$$('button');
    for (const b of modalBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && (txt.includes('Ha, yakunlayman') || txt.includes('Yakunlash'))) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_imtihon_natijalari.png') });

    // 8. Admin Login & Dashboard
    console.log('8. Admin Panel...');
    await page.goto('http://localhost:5173/#admin', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_admin_kirish_parol.png') });

    await page.type('input[type="password"]', 'JAMSHID');
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09_admin_sozlamalar_va_tekshirish.png') });

    console.log('🎉 COMPLETE FULL FLOW SCREENSHOTS SAVED!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureFullFlow();
