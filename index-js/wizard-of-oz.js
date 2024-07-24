const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const url = 'https://www.facebook.com/SlotsWizardOfOz/';
const maxLinks = 100;
const currentDate = moment().format('YYYY-MM-DD');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content();
    const $ = cheerio.load(content);
    const links = [];

    $('a[href*="zdnwoz0-a.akamaihd.net"], a[href*="zynga.social"]').each((index, element) => {
      if (links.length >= maxLinks) return false;  // Limit to maxLinks

      const link = $(element).attr('href');
      links.push({ href: link, text: `Wizard of Oz Free Coins - ${currentDate}` });
    });

    console.log('Fetched links:', links);

    const dir = 'links-json';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const filePath = path.join(dir, 'wizard-of-oz.json');
    fs.writeFileSync(filePath, JSON.stringify(links, null, 2), 'utf8');
    console.log(`Links saved to ${filePath}`);

    await browser.close();
  } catch (err) {
    console.error('Error fetching links:', err);
    process.exit(1);
  }
})();