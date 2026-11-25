'use strict';
const { execFile } = require('node:child_process');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

const host = '127.0.0.1';
const port = 4318;
const files = {
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/sw.js': ['sw.js', 'text/javascript'],
  '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'],
  '/icon.svg': ['icon.svg', 'image/svg+xml'],
  '/vendor/jsQR.js': ['vendor/jsQR.js', 'text/javascript']
};

const server = createServer(async (request, response) => {
  const path = request.url.split('?')[0];
  const asset = Object.hasOwn(files, path) ? files[path] : null;
  if (!asset || !['GET','HEAD'].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const [file, type] = asset;
    const body = await readFile(join(__dirname, file));
    response.writeHead(200, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-cache' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500).end();
  }
});
server.on('error',error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port 4318 is already in use.' : error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  const url = 'http://' + host + ':' + port + '/';
  console.log('NOVA: ' + url);
  if (process.platform === 'win32' && process.argv.includes('--open')) {
    execFile('rundll32.exe', ['url.dll,FileProtocolHandler', url], { windowsHide: true });
  }
});
