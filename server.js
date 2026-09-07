// Express server for hosting on Azure App Service (not used by Vercel, which
// serves the static files and api/ functions natively). Provides the same
// behavior as the Vercel setup: static hosting with extensionless URLs,
// the two API endpoints, the custom 404 page, and no access to internal files.
import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import formHandler from './api/form.js';
import mapsKeyHandler from './api/maps-key.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.use(compression());

// API endpoints — the handlers in api/ are (req, res) functions that work
// unchanged under Express. express.json() provides the parsed req.body.
app.post('/api/form', express.json(), formHandler);
app.get('/api/maps-key', mapsKeyHandler);

// Internal files that live in the repo but must never be served.
const blocked = /^\/(api(\/|$)|node_modules(\/|$)|_reference(\/|$)|server\.js$|package(-lock)?\.json$|FORMS\.md$|vercel\.json$|\.)/i;
app.use((req, res, next) => (blocked.test(req.path) ? notFound(req, res) : next()));

// Clean URLs, Vercel-style. For GET/HEAD:
// - /page/  -> 301 /page (trailing slash stripped)
// - /page.html and /index.html -> 301 to the extensionless form
// - /page serves page.html when it exists (checked explicitly, because
//   express.static prefers a same-named directory — e.g. blog/ vs blog.html)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  if (req.path.length > 1 && req.path.endsWith('/')) {
    return res.redirect(301, req.path.replace(/\/+$/, '') + query);
  }
  const m = req.path.match(/^(.*)\.html$/i);
  if (m) {
    const clean = m[1].replace(/(^|\/)index$/i, '$1').replace(/\/$/, '') || '/';
    return res.redirect(301, clean + query);
  }
  if (!path.basename(req.path).includes('.')) {
    const file = path.join(root, decodeURIComponent(req.path) + '.html');
    if (file.startsWith(root + path.sep) && existsSync(file)) {
      return res.sendFile(file);
    }
  }
  next();
});

// Static assets; directory redirects off (clean URLs are handled above).
app.use(express.static(root, { redirect: false }));

function notFound(req, res) {
  res.status(404).sendFile(path.join(root, '404.html'));
}
app.use(notFound);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Serving on port ${port}`));
