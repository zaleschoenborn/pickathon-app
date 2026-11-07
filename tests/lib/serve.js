// Serves the checkout like GitHub Pages does: gzip for text files, 10-minute cache headers.
// (Download sizes in the speed checks depend on this.)
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
const GZ = /^(text\/|application\/(json|javascript|manifest\+json)|image\/svg|font\/ttf)/;
module.exports = (ROOT) => new Promise((res) => {
  const gzc = new Map();
  const s = http.createServer((q, r) => {
    let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
    const fp = path.join(ROOT, f);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end('nf'); }
    const type = TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream';
    const h = { 'content-type': type, 'cache-control': 'max-age=600' };
    if (GZ.test(type) && /gzip/.test(q.headers['accept-encoding'] || '')) {
      const st = fs.statSync(fp), k = fp + ':' + st.mtimeMs; let b = gzc.get(k); if (!b) { b = zlib.gzipSync(fs.readFileSync(fp), { level: 6 }); gzc.set(k, b); }
      h['content-encoding'] = 'gzip'; h['content-length'] = b.length; r.writeHead(200, h); return r.end(b);
    }
    h['content-length'] = fs.statSync(fp).size; r.writeHead(200, h); fs.createReadStream(fp).pipe(r);
  });
  s.listen(0, '127.0.0.1', () => res([s, 'http://127.0.0.1:' + s.address().port + '/']));
});
