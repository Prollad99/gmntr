const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.facebook.com/SlotsWizardOfOz', { waitUntil: 'networkidle2' });

    let links = [];

    async function closeLoginPopup() {
      try {
        await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
        await page.click('div[role="dialog"] button');
        console.log('Closed login popup');
      } catch (e) {
        console.log('No login popup found');
      }
    }

    await closeLoginPopup();

    let retries = 5;
    while (retries > 0) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(5000); // Increase wait time for content to load

      await closeLoginPopup();

      const newLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        console.log('Anchors found:', anchors.length); // Debug log
        return anchors
          .map(anchor => anchor.href)
          .filter(href => href.startsWith('https://zynga.social/'))
          .map(href => ({
            href: href,
            date: new Date().toISOString().split('T')[0]
          }));
      });

      console.log('New links found:', newLinks);

      newLinks.forEach(link => {
        if (!links.some(existingLink => existingLink.href === link.href)) {
          links.push(link);
        }
      });

      if (newLinks.length === links.length) {
        retries--;
      }
    }

    console.log('Fetched links:', links);
    
    fs.writeFileSync('links-json/wizard-of-oz.json', JSON.stringify(links, null, 2));
    console.log('Links saved to links-json/wizard-of-oz.json');
  } catch (error) {
    console.error('Error fetching links:', error);
  } finally {
    await browser.close();
  }
}

run();
