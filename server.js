// Express server for hosting on Azure App Service (not used by Vercel, which
// serves the static files and api/ functions natively). Provides the same
// behavior as the Vercel setup: static hosting with extensionless URLs,
// the two API endpoints, the custom 404 page, and no access to internal files.
import express from 'express';
import compression from 'compression';
import path from 'node:path';
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

// Static site; `extensions` maps /contact-us -> contact-us.html etc.
app.use(express.static(root, { extensions: ['html'] }));

function notFound(req, res) {
  res.status(404).sendFile(path.join(root, '404.html'));
}
app.use(notFound);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Serving on port ${port}`));
