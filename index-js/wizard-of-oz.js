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

    // Set a common user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Function to scroll down and expand all posts
    await autoScrollAndExpand(page);

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

// Function to auto-scroll the page and expand all posts
async function autoScrollAndExpand(page){
  await page.evaluate(async () => {
    const distance = 100;
    const delay = 100;
    const scrollToBottom = () => {
      return new Promise(resolve => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollTo(0, scrollHeight);
        setTimeout(resolve, delay);
      });
    };

    while (document.documentElement.scrollHeight > window.scrollY + window.innerHeight) {
      await scrollToBottom();

      // Click on "See More" or "Continue Reading" buttons if they exist
      document.querySelectorAll('div[role="button"]').forEach(button => {
        if (button.innerText.includes('See More') || button.innerText.includes('Continue Reading')) {
          button.click();
        }
      });
    }
  });
}