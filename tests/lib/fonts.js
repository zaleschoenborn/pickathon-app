// Google Fonts is blocked in cloud sessions, which would make every page render in a fallback
// font and throw off the clipping checks. This serves the same fonts from npm (@fontsource)
// whenever the page asks fonts.googleapis.com, so text measures like it does for visitors.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const DIR = path.join(__dirname, '..', '.fontcache');
const PKGS = { '@fontsource-variable/bricolage-grotesque': ['opsz.css'], '@fontsource/inter': ['400.css', '500.css', '600.css', '700.css'], '@fontsource/anton': ['400.css'], '@fontsource/oswald': ['500.css', '600.css', '700.css'], '@fontsource/work-sans': ['400.css', '500.css', '700.css'], '@fontsource/instrument-serif': ['400.css', '400-italic.css'], '@fontsource-variable/fraunces': ['opsz.css'], '@fontsource/courier-prime': ['400.css', '700.css'] };
let css = null;

function build(log) {
  if (css !== null) return css;
  const nm = path.join(DIR, 'node_modules');
  if (!fs.existsSync(path.join(nm, '@fontsource/inter'))) {
    try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, 'package.json'), '{"name":"pkqa-fonts","private":true}'); execSync('npm i -s ' + Object.keys(PKGS).join(' '), { cwd: DIR, stdio: 'ignore', timeout: 180000 }); }
    catch (e) { log && log('WARNING: could not fetch fonts from npm; pages will use fallback fonts and text-fit results are less reliable'); return (css = ''); }
  }
  let out = '';
  for (const [pkg, files] of Object.entries(PKGS)) for (const f of files) {
    const p = path.join(nm, pkg, f); if (!fs.existsSync(p)) continue;
    out += fs.readFileSync(p, 'utf8').replace(/ Variable'/g, "'").replace(/url\(\.\/files\//g, 'url(https://fonts.gstatic.com/pkqa/' + pkg + '/files/').replace(/woff2-variations/g, 'woff2') + '\n';
  }
  return (css = out);
}

exports.route = async (ctx, log) => {
  const c = build(log); if (!c) return;
  await ctx.route(/^https:\/\/fonts\.googleapis\.com\//, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: c }));
  await ctx.route(/^https:\/\/fonts\.gstatic\.com\/pkqa\//, (r) => { const rel = decodeURIComponent(new URL(r.request().url()).pathname.replace(/^\/pkqa\//, '')); const fp = path.join(DIR, 'node_modules', rel); if (!fp.startsWith(DIR) || !fs.existsSync(fp)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(fp) }); });
};
