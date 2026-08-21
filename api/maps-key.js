// Serves the Google Maps API key from the GOOGLE_MAPS_API_KEY env var as a
// tiny script, so the key lives in Vercel config rather than the repo.
// Loaded by contact-us.html before webflow.js, whose map widget reads
// window.GOOGLE_MAPS_API_KEY (see the patched loader in js/webflow.js).
export default function handler(req, res) {
  const key = process.env.GOOGLE_MAPS_API_KEY || '';
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(`window.GOOGLE_MAPS_API_KEY=${JSON.stringify(key)};`);
}
