import { readFileSync, writeFileSync } from 'node:fs';

const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8').trim();
const groups = {
  'Surfaces': ['bg', 'bg-1', 'bg-2', 'bg-3', 'text', 'text-dim', 'text-faint', 'line-strong'],
  'Colour meanings': ['accent', 'accent-soft', 'now', 'now-soft', 'good', 'bad', 'warn'],
  'Stage and models': ['stage', 'note-right', 'note-left', 'hit', 'miss', 'viewer-glow', 'viewer-mid', 'viewer-edge', 'model-loading-bg'],
};
const html = `<!doctype html>
<html lang="en" data-theme="light"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Practice Deck design system</title>
<style data-design-tokens>${tokens}</style>
<style>
body { margin:var(--sp-5); background:var(--bg); color:var(--text); font-family:var(--sans); }
main { margin:auto; } h1 { font-size:var(--fs-2xl); } h2 { font-size:var(--fs-xl); }
p { color:var(--text-dim); line-height:1.7; } button { min-height:var(--control-h); padding:var(--sp-2) var(--sp-4); border:1px solid var(--line-strong); border-radius:var(--control-r); background:var(--bg-1); color:var(--text); font:inherit; }
.swatches { display:grid; grid-template-columns:repeat(auto-fit,minmax(calc(var(--control-h-lg)*3),1fr)); gap:var(--sp-3); }
.swatch { background:var(--bg-1); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; }
.colour { height:var(--control-h-lg); background:var(--colour); } .label { padding:var(--sp-3); }
code { font-family:var(--mono); font-size:var(--fs-xs); } .value { display:block; margin-top:var(--sp-1); color:var(--text-dim); }
.controls { display:flex; flex-wrap:wrap; gap:var(--sp-3); } .primary { background:var(--accent); color:var(--on-accent); border-color:var(--accent); }
</style>
<main><h1>Practice Deck design system</h1><p>Violet: app surfaces and choices. Blue: the music's position. Good/bad: the verdict on playing. Amber: difficulty and caution.</p>
<button id="theme">Switch to dark theme</button>
${Object.entries(groups).map(([name, list]) => `<section><h2>${name}</h2><div class="swatches">${list.map(token => `<div class="swatch"><div class="colour" style="--colour:var(--${token})"></div><div class="label"><code>--${token}</code><code class="value" data-token="${token}"></code></div></div>`).join('')}</div></section>`).join('')}
<section><h2>Controls and type</h2><div class="controls"><button class="primary">Primary action</button><button>Secondary action</button></div><p>Compact controls: <code id="height"></code>. Body: <code id="body-size"></code>. Controls use the shared radius and spacing tokens.</p></section>
<p>Source: src/styles/tokens.css. Run <code>npm run design:sync</code> after editing tokens; npm test checks this mirror.</p></main>
<script>
function refresh() { const css=getComputedStyle(document.documentElement); document.querySelectorAll('[data-token]').forEach(el=>el.textContent=css.getPropertyValue('--'+el.dataset.token).trim()); document.getElementById('height').textContent=css.getPropertyValue('--control-h-sm').trim(); document.getElementById('body-size').textContent=css.getPropertyValue('--fs-md').trim(); }
document.getElementById('theme').onclick=function(){const dark=document.documentElement.dataset.theme!=='dark'; document.documentElement.dataset.theme=dark?'dark':'light'; this.textContent='Switch to '+(dark?'light':'dark')+' theme'; refresh();}; refresh();
</script></html>`;
writeFileSync(new URL('../../docs/design/design-system.html', import.meta.url), html);
console.log('Updated docs/design/design-system.html');
