const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const facebookUrl = 'https://www.facebook.com/login';
const targetUrl = 'https://www.facebook.com/SlotsWizardOfOz/';
const email = 'www.prollad@gmail.com';
const password = 'Prollad93.Fb';
const maxLinks = 100;
const currentDate = moment().format('YYYY-MM-DD');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(facebookUrl, { waitUntil: 'networkidle2' });

    await page.type('#email', email);
    await page.type('#pass', password);
    await page.click('button[name="login"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    await autoScrollAndExpand(page);

    const content = await page.content();
    const $ = cheerio.load(content);
    const links = [];

    $('a[href*="l.facebook.com/l.php?u="]').each((index, element) => {
      if (links.length >= maxLinks) return false;

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

      document.querySelectorAll('div[role="button"]').forEach(button => {
        if (button.innerText.includes('See More') || button.innerText.includes('Continue Reading')) {
          button.click();
        }
      });
    }
  });
}