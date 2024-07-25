const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const url = 'https://www.facebook.com/SlotsWizardOfOz/';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Close the Facebook popup if it appears
    const popupCloseSelector = 'div[role="dialog"] div[aria-label="Close"]';
    if (await page.$(popupCloseSelector)) {
      await page.click(popupCloseSelector);
    }

    // Wait for necessary elements to load
    await page.waitForSelector('a[href*="zdnwoz0-a.akamaihd.net"], a[href*="zynga.social"]');

    const links = await page.$$eval('a[href*="zdnwoz0-a.akamaihd.net"], a[href*="zynga.social"]', anchors => {
      return anchors.map(anchor => ({
        href: anchor.href,
        text: anchor.textContent.trim(),
        date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      }));
    });

    // Limit to 100 links
    const limitedLinks = links.slice(0, 100);

    console.log('Fetched links:', limitedLinks);

    const dir = 'links-json';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    const filePath = path.join(dir, 'wizard-of-oz.json');
    fs.writeFileSync(filePath, JSON.stringify(limitedLinks, null, 2), 'utf8');
    console.log(`Links saved to ${filePath}`);

  } catch (err) {
    console.error('Error fetching links:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();