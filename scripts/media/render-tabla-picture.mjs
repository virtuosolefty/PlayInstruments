/**
 * render-tabla-picture.mjs — the picture the tabla's 2D view is played on (TablaMap.jsx).
 *
 * Renders the tabla model with the app's own 3D studio, as the stage lights it, from the player's seat but higher up
 * so both heads show as wide ellipses, and measures where each drum's head lands in the picture. Writes
 * public/media/tabla-from-above.webp and prints the heads' ellipses (percent of the picture), which go into
 * PICTURE.heads in src/lib/struck/tablaMap.js. Needs the dev server running and the machine's graphics card.
 *
 *   node scripts/media/render-tabla-picture.mjs [url]
 */
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { toWebp } from '../models/images.mjs';

const URL_ = process.argv[2] ?? 'http://localhost:5173/';
const W = 960, H = 560;
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('page:', m.text()); });
await page.goto(URL_, { waitUntil: 'networkidle' });
const studioSource = await (await page.request.get(new URL('/src/lib/stage/studio.js', URL_).href)).text();
const threeUrl = studioSource.match(/\/node_modules\/\.vite\/deps\/three\.js\?v=[0-9a-f]+/)[0];

const result = await page.evaluate(async ({ threeUrl, W, H }) => {
  const { Box3, Group, Vector3 } = await import(threeUrl);
  const { createStudio } = await import('/src/lib/stage/studio.js');
  const { measureHeads } = await import('/src/lib/stage/tablaZones.js');
  const { loadInstrumentModel } = await import('/src/lib/stage/models.js');
  document.body.innerHTML = '';
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;background:transparent`;
  document.body.appendChild(el);
  const studio = createStudio(el, { theme: 'dark', quality: 'full' });
  const loaded = await loadInstrumentModel('tabla');
  const root = new Group();
  root.add(loaded.scene);
  const box0 = new Box3().setFromObject(root), size0 = box0.getSize(new Vector3());
  const scale = 0.9 / Math.max(size0.x, size0.z);
  root.scale.setScalar(scale);
  root.position.set(-((box0.min.x + box0.max.x) / 2) * scale, -box0.min.y * scale, -((box0.min.z + box0.max.z) / 2) * scale);
  studio.scene.add(root);
  root.updateMatrixWorld(true);
  const fitted = new Box3().setFromObject(root);
  studio.fitGround({ min: fitted.min.toArray(), max: fitted.max.toArray() });

  // Each drum's head, measured as the 3D stage measures it for its rings (tablaZones.js).
  const drums = new Map();
  loaded.scene.traverse(node => { const id = /^drum-([a-z]+)-/.exec(node.name)?.[1]; if (id) drums.set(id, [...(drums.get(id) ?? []), node]); });
  const heads = measureHeads(drums);
  const shot = { box: { min: fitted.min.toArray(), max: fitted.max.toArray() }, azimuthDeg: 0, elevationDeg: 62 };
  studio.frame(shot, { view: { fovDeg: 28 } });
  studio.render();
  const png = el.querySelector('canvas').toDataURL('image/png');
  const project = studio.projector(studio.scene);
  const ellipses = {};
  for (const [id, h] of Object.entries(heads)) {
    const ring = Array.from({ length: 72 }, (_, i) => { const a = (i / 72) * Math.PI * 2; return project(h.cx + Math.cos(a) * h.r, h.y, h.cz + Math.sin(a) * h.r); });
    const xs = ring.map(p => p.x), ys = ring.map(p => p.y);
    const c = project(h.cx, h.y, h.cz);
    ellipses[id] = { x: +(c.x / W * 100).toFixed(2), y: +(c.y / H * 100).toFixed(2), rx: +((Math.max(...xs) - Math.min(...xs)) / 2 / W * 100).toFixed(2), ry: +((Math.max(...ys) - Math.min(...ys)) / 2 / H * 100).toFixed(2) };
  }
  return { png, ellipses, heads };
}, { threeUrl, W, H });

const bytes = Buffer.from(result.png.split(',')[1], 'base64');
const [webp] = await toWebp([{ bytes: new Uint8Array(bytes), mimeType: 'image/png', maxSize: W, quality: 0.84 }]);
writeFileSync('public/media/tabla-from-above.webp', webp.bytes);
console.log(JSON.stringify({ ellipses: result.ellipses, heads: result.heads, size: [webp.width, webp.height], kb: Math.round(webp.bytes.length / 1024) }, null, 1));
await browser.close();
