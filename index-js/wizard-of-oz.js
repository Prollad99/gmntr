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

    // Function to close the login popup if it appears
    async function closeLoginPopup() {
      try {
        await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
        await page.click('div[role="dialog"] button');
      } catch (e) {
        console.log('No login popup found');
      }
    }

    // Close the popup if it appears initially
    await closeLoginPopup();

    // Scroll and load posts
    let retries = 5;
    while (retries > 0) {
      const newLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
          .map(anchor => anchor.href)
          .filter(href => href.startsWith('https://zynga.social/'))
          .map(href => ({
            href: href,
            date: new Date().toISOString().split('T')[0]
          }));
      });

      // Filter new links that haven't been collected yet
      newLinks.forEach(link => {
        if (!links.some(existingLink => existingLink.href === link.href)) {
          links.push(link);
        }
      });

      // Check if no new content is loaded
      if (newLinks.length === links.length) {
        retries--;
      }

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(2000); // wait for new content to load

      // Close the popup if it reappears
      await closeLoginPopup();
    }

    console.log('Fetched links:', links);
    
    // Save the links to a JSON file
    fs.writeFileSync('links-json/wizard-of-oz.json', JSON.stringify(links, null, 2));
    console.log('Links saved to links-json/wizard-of-oz.json');
  } catch (error) {
    console.error('Error fetching links:', error);
  } finally {
    await browser.close();
  }
}

run();
