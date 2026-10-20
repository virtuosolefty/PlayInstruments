import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Entry from './Entry.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

/**
 * The typefaces, self-hosted.
 *
 * The design system named Inter from the start but nothing ever loaded it, so
 * every weight, size and letterspacing in the app was being tuned against
 * whatever the operating system happened to substitute — Segoe UI on Windows,
 * SF on a Mac. The variable weight axis is the whole file rather than one
 * static cut per weight, and each subset carries a `unicode-range`, so an
 * English session downloads the latin subset alone.
 */
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';

import './styles/tokens.css';
import './styles/styles.css';
import './styles/studio.css';
import './styles/desktop.css';
import './styles/instruments.css';
import './styles/polish.css';
import './styles/guitar.css';
import './styles/practice-ux.css';
import './styles/learning.css';
import './styles/discovery.css';
import './styles/strings.css';
import './styles/drums.css';
import './styles/models.css';
import './styles/tuner.css';
import './styles/flow.css';
import './styles/chrome.css';
import './styles/phone.css';
import './styles/clarity.css';
import './styles/display.css';
import './styles/studio-layout.css';
import './styles/lesson-stage.css';
import './styles/landscape.css';
import './styles/patterns.css';

document.getElementById('public-intro')?.remove();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Entry />
    </ErrorBoundary>
  </StrictMode>,
);

// Practise without a connection: public/sw.js keeps the app on the device. Production builds only, so the dev
// server's modules are never cached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(error => console.warn('[offline] the app will need a connection to open:', error.message));
  });
}
