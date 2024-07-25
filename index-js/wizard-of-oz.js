const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const url = 'https://www.facebook.com/SlotsWizardOfOz/';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Close the Facebook login popup if it appears
    const popupCloseSelector = 'div[role="dialog"] div[aria-label="Close"]';
    if (await page.$(popupCloseSelector)) {
      await page.click(popupCloseSelector);
      await page.waitForTimeout(2000); // Wait for 2 seconds after closing the popup
    }

    // Scroll down to load more posts
    let previousHeight;
    let links = [];
    let retries = 5;

    while (links.length < 100 && retries > 0) {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      try {
        await page.waitForFunction(
          `document.body.scrollHeight > ${previousHeight}`,
          { timeout: 60000 }
        );
      } catch (e) {
        console.error('Timeout while waiting for new content to load:', e);
        break;
      }
      await page.waitForTimeout(5000); // wait for 5 seconds to load more posts

      // Extract links
      const newLinks = await page.$$eval('a[href*="zynga.social"]', anchors => {
        return anchors.map(anchor => ({
          href: anchor.href,
          date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
        }));
      });

      console.log(`Found ${newLinks.length} new links`);

      // Add only new unique links
      newLinks.forEach(link => {
        if (!links.some(existingLink => existingLink.href === link.href)) {
          links.push(link);
        }
      });

      console.log(`Total links collected so far: ${links.length}`);

      retries--;
    }

    // Limit to 100 links
    links = links.slice(0, 100);

    console.log('Fetched links:', links);

    const dir = 'links-json';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    const filePath = path.join(dir, 'wizard-of-oz.json');
    fs.writeFileSync(filePath, JSON.stringify(links, null, 2), 'utf8');
    console.log(`Links saved to ${filePath}`);

  } catch (err) {
    console.error('Error fetching links:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();