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
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Scroll down the page to load more content
    await autoScroll(page);

    // Get the content after scrolling
    const content = await page.content();
    const $ = cheerio.load(content);
    const links = [];

    $('a[href*="l.facebook.com/l.php?u="]').each((index, element) => {
      if (links.length >= maxLinks) return false;  // Limit to maxLinks

      // Extract the actual URL from the Facebook redirect link
      const facebookLink = $(element).attr('href');
      const urlMatch = facebookLink.match(/u=([^&]+)/);
      if (urlMatch) {
        const decodedUrl = decodeURIComponent(urlMatch[1]);
        links.push({ href: decodedUrl, text: `Wizard of Oz Free Coins - ${currentDate}` });
      }
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

// Function to auto-scroll the page
async function autoScroll(page){
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if(totalHeight >= scrollHeight){
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}