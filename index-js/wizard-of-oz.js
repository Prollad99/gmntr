const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Function to get the current date in YYYY-MM-DD format
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const url = 'https://mosttechs.com/wizard-of-oz-slots-free-coins/';
const currentDate = getCurrentDate();
const dir = 'links-json';
const filePath = path.join(dir, 'wizard-of-oz.json');

// Read existing links from the JSON file if it exists
let existingLinks = [];
if (fs.existsSync(filePath)) {
  existingLinks = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

axios.get(url)
  .then(({ data }) => {
    const $ = cheerio.load(data);
    const newLinks = [];

    $('a[href*="zdnwoz0-a.akamaihd.net"], a[href*="zynga.social"]').each((index, element) => {
      const link = $(element).attr('href');
      const existingLink = existingLinks.find(l => l.href === link);
      const date = existingLink ? existingLink.date : currentDate;
      newLinks.push({ href: link, text: `WOZ Free Coins ${date}` });
    });

    // Remove duplicates and limit the list to 100 links
    const combinedLinks = [...newLinks, ...existingLinks]
      .reduce((acc, link) => {
        if (!acc.find(({ href }) => href === link.href)) {
          acc.push(link);
        }
        return acc;
      }, [])
      .slice(0, 100); // Limit to 100 links

    console.log('Final links:', combinedLinks);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    fs.writeFileSync(filePath, JSON.stringify(combinedLinks, null, 2), 'utf8');
    console.log(`Links saved to ${filePath}`);
  })
  .catch(err => {
    console.error('Error fetching links:', err);
    process.exit(1);
  });