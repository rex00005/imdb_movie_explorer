const path = require('path');
const fs = require('fs');

const data = [];
for (let i = 0; ; ++i) {
  try {
    const content = fs.readFileSync(
      path.resolve(__dirname, `../crawl-data/data_${i}.json`)
    );
    const json = JSON.parse(content);
    data.push(...json);
  } catch (err) {
    break;
  }
}

fs.writeFileSync(
  path.resolve(__dirname, '../data/data.json'),
  JSON.stringify(data, null, 2)
);
