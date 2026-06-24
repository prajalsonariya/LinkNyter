const fs = require('fs');
for (let i = 5; i <= 8; i++) {
  try {
    const data = JSON.parse(fs.readFileSync(`screen${i}_data.json`, 'utf8'));
    const content = data.result.content[0].text;
    const parsed = JSON.parse(content);
    if (parsed.htmlCode && parsed.htmlCode.code) {
      fs.writeFileSync(`screen${i}.html`, parsed.htmlCode.code);
      console.log(`Saved screen${i}.html`);
    } else {
      console.log(`No htmlCode for screen${i}`);
    }
  } catch(e) {
    console.error(`Error parsing screen${i}:`, e.message);
  }
}
