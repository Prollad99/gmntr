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
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

    // Function to close the Facebook login popup if it appears
    const closePopup = async () => {
      const popupCloseSelectors = [
        'div[role="dialog"] div[aria-label="Close"]',
        'div[role="dialog"] button[aria-label="Close"]',
        'div[role="dialog"] button[aria-label="Dismiss"]',
      ];

      for (const selector of popupCloseSelectors) {
        const popup = await page.$(selector);
        if (popup) {
          console.log('Closing the Facebook login popup');
          await popup.click();
          await page.waitForTimeout(2000); // Wait for 2 seconds after closing the popup
          return true;
        }
      }
      return false;
    };

    // Attempt to close the popup multiple times if necessary
    for (let i = 0; i < 5; i++) {
      const popupClosed = await closePopup();
      if (!popupClosed) break;
      await page.waitForTimeout(1000); // Wait for 1 second before retrying
    }

    // Function to extract links from the page
    const extractLinks = async () => {
      return page.$$eval('a[href*="zynga.social"]', anchors => {
        return anchors.map(anchor => ({
          href: anchor.href,
          date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
        }));
      });
    };

    // Extract initial links
    let links = await extractLinks();
    console.log(`Found ${links.length} links initially`);

    // Scroll down to load more posts and extract links
    let previousHeight = await page.evaluate('document.body.scrollHeight');
    let retries = 5;

    while (links.length < 100 && retries > 0) {
      console.log('Scrolling down to load more posts');
      
      // Scroll incrementally
      for (let i = 0; i < 5; i++) {
        await page.evaluate('window.scrollBy(0, window.innerHeight / 2)');
        await page.waitForTimeout(2000); // wait for 2 seconds after each small scroll
      }
      
      await page.waitForTimeout(5000); // wait for 5 seconds to load more posts after full scroll

      const newLinks = await extractLinks();
      console.log(`Found ${newLinks.length} new links`);

      // Add only new unique links
      newLinks.forEach(link => {
        if (!links.some(existingLink => existingLink.href === link.href)) {
          links.push(link);
        }
      });

      console.log(`Total links collected so far: ${links.length}`);

      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) {
        retries--;
        console.log(`No new content loaded. Retries left: ${retries}`);
      } else {
        previousHeight = newHeight;
        retries = 5; // reset retries if new content is loaded
      }
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