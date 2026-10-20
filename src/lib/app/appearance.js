/**
 * appearance.js — how the page looks, as attributes on the root element.
 *
 * The theme, the dark room's accent, true black and the text size are all
 * token swaps in tokens.css, keyed on data-* attributes here. One function sets
 * them all so the studio and the welcome page cannot drift apart.
 */

/** The dark accents, in the order the picker shows them. Ivory is the default. */
export const ACCENTS = Object.freeze([
  Object.freeze({ id: 'ivory', label: 'Ivory', swatch: '#ece3cf' }),
  Object.freeze({ id: 'silver', label: 'Silver', swatch: '#dfe5ef' }),
  Object.freeze({ id: 'copper', label: 'Copper', swatch: '#e8956b' }),
  Object.freeze({ id: 'violet', label: 'Violet', swatch: '#a594ff' }),
]);
const DEFAULT_ACCENT = 'ivory';

/** The attributes for these settings: unknown values fall back rather than leaving the page unstyled. */
export function appearanceFor(settings = {}) {
  const theme = settings.theme === 'dark' ? 'dark' : 'light';
  const accent = ACCENTS.some(a => a.id === settings.darkAccent) ? settings.darkAccent : DEFAULT_ACCENT;
  return Object.freeze({
    theme,
    accent,
    black: theme === 'dark' && settings.trueBlack === true,
    text: settings.textSize === 'large' ? 'large' : 'standard',
  });
}

/** The colour the browser's own chrome (a phone's address bar) takes. */
export const chromeColour = ({ theme, black }) => (theme === 'light' ? '#f2f0eb' : black ? '#000000' : '#0b0b10');

/** Writes the attributes onto `root` (the <html> element). Violet is the tokens' own default, so it needs none. */
export function applyAppearance(root, look) {
  root.dataset.theme = look.theme;
  root.style.colorScheme = look.theme;
  if (look.accent === 'violet') delete root.dataset.accent; else root.dataset.accent = look.accent;
  if (look.black) root.dataset.black = ''; else delete root.dataset.black;
  if (look.text === 'large') root.dataset.text = 'large'; else delete root.dataset.text;
  root.ownerDocument?.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.setAttribute('content', chromeColour(look)); m.removeAttribute('media'); });
}
