/**
 * shoot-instruments.mjs — the welcome page's "Inside the studio" previews.
 *
 * Opens each instrument's first guided lesson in the dark theme and writes
 * public/media/<instrument>-studio.png: the instrument's working area (the
 * roll, the tab over the instrument, the lanes beside the kit) cropped to
 * 16:9, the shape the welcome page reserves. The whole app at that size had
 * 6px text and an instrument a third of the frame; the home page's banner
 * crops the same pictures. Needs the dev server running, and the
 * machine's own graphics card: the downloaded models and the 3D kit are only
 * drawn at full detail, and a picture of the lighter stage would not be what a
 * visitor gets. Take them again whenever the studio's look changes; they were
 * a month out of date once, and showed a screen that no longer existed.
 *
 *   node scripts/media/shoot-instruments.mjs [url] [instrument ...]
 */
import { chromium } from '@playwright/test';

const URL = process.argv[2] ?? 'http://localhost:5173/';
const wanted = process.argv.slice(3);
const LESSONS = {
  piano: { id: 'path-01-home-five-right', stage: '.roll-area canvas' },
  guitar: { study: 'guitarStudyId', id: 'guitar-open-strings', stage: '.guitar-stage[data-stage-tier="full"] canvas' },
  bass: { study: 'bassStudyId', id: 'bass-open-strings', stage: '.guitar-stage[data-stage-tier="full"] canvas' },
  violin: { study: 'violinStudyId', id: 'violin-open-strings', stage: '.bowed-stage-3d[data-stage-model="violin"] canvas' },
  cello: { study: 'celloStudyId', id: 'cello-open-strings', stage: '.bowed-stage-3d[data-stage-model="cello"] canvas' },
  drums: { study: 'drumsStudyId', id: 'drums-meet-the-kit', stage: '.drum-stage[data-ready="true"] canvas' },
  veena: { study: 'veenaStudyId', id: 'veena-open-strings', stage: '.guitar-stage[data-stage-tier="full"] canvas' },
  tabla: { study: 'tablaStudyId', id: 'tabla-meet-the-tabla', stage: '.tabla-stage[data-ready="true"] canvas' },
  handpan: { study: 'handpanStudyId', id: 'handpan-meet-the-ding', stage: '.handpan-stage[data-ready="true"] canvas' },
};
const GPU = ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'];

const browser = await chromium.launch({ args: GPU });
try {
  for (const [instrument, lesson] of Object.entries(LESSONS)) {
    if (wanted.length && !wanted.includes(instrument)) continue;
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({ instrument, lesson }) => {
      localStorage.setItem('piano-practice-coach:v1', JSON.stringify({ version: 1, songs: {}, settings: {
        onboarded: true, studioTourDone: true, practiceInstrument: instrument, learningView: 'lesson', theme: 'dark', renderer: 'gl',
        settingsVersion: 5, stageQuality: 'full', ...(lesson.study && { [lesson.study]: lesson.id }), learning: { [instrument]: { lessonId: lesson.id, step: 'sound' } },
      } }));
    }, { instrument, lesson });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator(lesson.stage).first().waitFor({ timeout: 90000 });
    // The camera settles and the textures arrive.
    await page.waitForTimeout(5000);
    // The picture is of the instrument: the lesson's step card would cover it.
    await page.addStyleTag({ content: '.step-card-anchor { visibility: hidden !important; }' });
    if (errors.length) throw new Error(`${instrument}: ${errors.join('; ')}`);
    const area = await page.locator(lesson.stage).first().evaluate(canvas => {
      // A struck instrument's lanes and stage are side by side in its board: framed from the right, so the
      // instrument is whole and the lanes are cut, not the other way round.
      const board = canvas.closest('.drum-board');
      const box = (board ?? canvas.closest('.roll-area, .guitar-workspace') ?? canvas).getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: !!board };
    });
    const width = Math.min(area.width, (area.height * 16) / 9), height = (width * 9) / 16;
    // Centred across; from the bottom up, where the instrument is, when the area is taller than 16:9.
    const clip = { x: area.right ? area.x + area.width - width : area.x + (area.width - width) / 2, y: area.y + area.height - height, width, height };
    await page.screenshot({ path: `public/media/${instrument}-studio.png`, clip });
    console.log(`wrote public/media/${instrument}-studio.png`);
    await page.close();
  }
} finally {
  await browser.close();
}
