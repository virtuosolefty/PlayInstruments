/**
 * Generated cover art for a piece. No images to download or license: a
 * gradient seeded from the composer (so one composer's pieces share a colour
 * inside the app's violet-to-blue band) and the piece's initials, with a faint stave drawn across it.
 */
/** The band the art is drawn from: hues 214 (the music's blue) to 260 (the interface's violet). */
const ART_HUE = 214;
const ART_SPREAD = 46;

function hash(str = '') {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function initials(title = '') {
  const words = title.replace(/\(.*?\)|—.*$/g, '').split(/[\s,–-]+/).filter(w => /^[A-Za-zÀ-ÿ0-9]/.test(w));
  return (words.slice(0, 2).map(w => w[0]).join('') || '♪').toUpperCase();
}

export default function PieceArt({ title, composer, size = 40, kind }) {
  const seed = hash(composer || kind || title);
  // One family, from the interface's violet to the music's blue: a composer keeps a hue of their own inside it, and
  // a piece its own lightness. A hue from anywhere on the wheel made the library the loudest screen in the app.
  const hue = ART_HUE + (seed % ART_SPREAD);
  const light = 46 + (hash(title) % 14);
  const style = {
    width: size, height: size,
    '--art-a': `hsl(${hue} 52% ${light}%)`,
    '--art-b': `hsl(${hue + 12} 46% ${light - 22}%)`,
  };
  return (
    <span className="piece-art" style={style} aria-hidden="true">
      <svg viewBox="0 0 40 40" preserveAspectRatio="none">
        {[14, 18, 22, 26, 30].map(y => <line key={y} x1="0" x2="40" y1={y} y2={y} />)}
      </svg>
      <b>{initials(title)}</b>
    </span>
  );
}
