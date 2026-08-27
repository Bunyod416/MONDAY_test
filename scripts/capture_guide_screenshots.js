import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../docs/images');

async function runCapture() {
  console.log('Launching browser with Edge binary...');
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
    // 1. Initial Registration Screen
    console.log('1. Capturing Initial Registration Page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_kirish_royxat.png') });

    // 2. Filling Student Name & Group Code FRONTEND-01
    console.log('2. Filling student details and group code...');
    await page.type('input[placeholder="Ismingizni kiriting"]', 'Alisher');
    await page.type('input[placeholder="Familiyangizni kiriting"]', 'Navoiy');
    await page.type('input[placeholder="Guruh kodini kiriting..."]', 'FRONTEND-01');

    console.log('Waiting for group validation card...');


    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_guruh_tasdiqlandi.png') });

    // 3. Click "Imtihonni Boshlash"
    console.log('3. Submitting registration...');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await new Promise((r) => setTimeout(r, 1200));

    // Fullscreen step
    console.log('4. Fullscreen prompt...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_fullscreen_bosqichi.png') });

    // Click "To'liq Ekranga Kirish va Boshlash"
    const allBtns = await page.$$('button');
    for (const b of allBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && (txt.includes('Boshlash') || txt.includes('Kirish') || txt.includes('Davom etish'))) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));

    // 4. Live Exam Screen (MCQ Question)
    console.log('5. Capturing live MCQ Exam Screen...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_imtihon_mcq_savol.png') });

    // 5. Select Option & Hint
    console.log('6. Selecting answer option...');
    const optionCards = await page.$$('button');
    for (const opt of optionCards) {
      const text = await page.evaluate(el => el.textContent, opt);
      if (text && (text.includes("To'g'ri") || text.startsWith('A)') || text.startsWith('B)') || text.includes('<h1>'))) {
        await opt.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_javob_belgilandi.png') });

    // 6. Switch Category Tab (CSS)
    console.log('7. Switching to CSS category...');
    const catButtons = await page.$$('button');
    for (const btn of catButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('CSS')) {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_savol_turlari_kod_yozish.png') });

    // 7. Open Finish Exam Modal
    console.log('8. Opening Finish Exam modal...');
    const finishBtns = await page.$$('button');
    for (const btn of finishBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Imtihonni yakunlash') || text.includes('Topshirish'))) {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_yakunlash_tasdiqlash_modal.png') });

    // 8. Click "Ha, yakunlash" inside the modal -> Capture Results Screen
    console.log('9. Submitting exam and capturing results page...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => b.textContent && b.textContent.includes('Ha, yakunlash'));
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_natijalar_sahifasi.png') });

    // 9. Admin Login Screen
    console.log('10. Capturing Admin Login Screen...');
    await page.goto('http://localhost:5173/#admin', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09_admin_kirish.png') });

    // 10. Admin Dashboard
    console.log('11. Logging into Admin Panel...');
    await page.type('input[type="password"]', 'JAMSHID');
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10_admin_monitoring_va_boshqaruv.png') });

    console.log('✅ ALL SCREENSHOTS RE-CAPTURED CLEANLY!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

runCapture();
