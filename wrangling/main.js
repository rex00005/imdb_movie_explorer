const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const axios = require('axios');

const apikey = 'bbbde262';
const csvContent = fs.readFileSync('./initial-data/imdb_movies.csv', {
  encoding: 'utf-8',
});

const LOG_FILE_PATH = './crawl-log/log.json';
const ERR_LIST_FILE_PATH = './crawl-log//err-list.txt';
const COUNT_PER_FILE = 1000;
const PARALLEL_COUNT = 10;

async function fetchData(item) {
  console.log('start fetch ', item['']);
  const date = new Date();
  const { data } = await axios({
    method: 'get',
    url: `http://www.omdbapi.com/?apikey=${apikey}&i=${encodeURIComponent(
      item.tconst
    )}`,
    timeout: 1000 * 10,
  });
  console.log(
    'end fetch',
    item[''],
    'time:',
    `${(new Date().valueOf() - date.valueOf()) / 1000}s`
  );
  return data;
}

async function main() {
  while (true) {
    const logJson = JSON.parse(
      fs.readFileSync(LOG_FILE_PATH, { encoding: 'utf-8' })
    );

    const nextLineNum = logJson.nextLineNum;
    const writeFileName = `./crawl-data/data_${
      (nextLineNum - 1) / COUNT_PER_FILE
    }.json`;
    const endLineNum = nextLineNum + COUNT_PER_FILE - 1;

    const records = parse(csvContent, {
      from: nextLineNum,
      to: endLineNum,
      columns: true,
      skip_empty_lines: true,
    });

    if (records.length === 0) {
      break;
    }

    const list = [];
    const errList = [];
    const errTryCnt = {};
    for (let idx = 0; idx < records.length; ++idx) {
      const item = records[idx];
      const id = item[''];
      try {
        const data = await fetchData(item);
        data.crawlId = id;
        list.push(data);
        if (data.Response !== 'True' || data.Error) {
          data.isCrawlError = true;
          errList.push(id);
        }
      } catch (err) {
        errTryCnt[id] = (errTryCnt[id] || 0) + 1;
        if (errTryCnt >= 3) {
          const data = { crawlId: id, isCrawlError: true };
          list.push(data);
          errList.push(id);
        } else {
          // 重试
          --idx;
        }
      }
    }

    fs.writeFileSync(writeFileName, JSON.stringify(list, undefined, 2));
    fs.writeFileSync(ERR_LIST_FILE_PATH, errList.join(', ') + '\n', {
      flag: nextLineNum === 1 ? 'w' : 'a',
    });
    logJson.nextLineNum = endLineNum + 1;
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logJson, undefined, 2));
  }
}

main();
