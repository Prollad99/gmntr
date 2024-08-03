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

// Function to format the date in "Month Day, Year" format
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const url = 'https://mosttechs.com/wizard-of-oz-slots-free-coins/';
const currentDate = getCurrentDate();
const dir = 'links-json';
const filePath = path.join(dir, 'wizard-of-oz.json');
const htmlFilePath = path.join('static/rewards', 'wizard-of-oz.html');

// Read existing links from the JSON file if it exists
let existingLinks = [];
if (fs.existsSync(filePath)) {
  try {
    const fileData = fs.readFileSync(filePath, 'utf8');
    if (fileData) {
      existingLinks = JSON.parse(fileData);
    }
  } catch (error) {
    console.error('Error reading existing links:', error);
  }
}

axios.get(url)
  .then(({ data }) => {
    const $ = cheerio.load(data);
    const newLinks = [];

    $('a[href*="zdnwoz0-a.akamaihd.net"], a[href*="zynga.social"], a[href*="wozslots.onelink.me"]').each((index, element) => {
      const link = $(element).attr('href');
      const existingLink = existingLinks.find(l => l.href === link);
      const date = existingLink ? existingLink.date : currentDate;
      newLinks.push({ href: link, date: date });
    });

    // Combine new links with existing links, keeping the older dates if they exist
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

    // Generate HTML file
    let htmlContent = '<ul class="list-group mb-4">\n';
    combinedLinks.forEach(link => {
      htmlContent += `  <li class="list-group-item d-flex justify-content-between align-items-center">\n`;
      htmlContent += `    <span>WOZ Free Coins for ${formatDate(link.date)}</span>\n`;
      htmlContent += `    <a href="${link.href}" class="btn btn-primary btn-sm">Collect</a>\n`;
      htmlContent += `  </li>\n`;
    });
    htmlContent += '</ul>';

    fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
    console.log(`HTML file saved to ${htmlFilePath}`);
  })
  .catch(err => {
    console.error('Error fetching links:', err);
    process.exit(1);
  });