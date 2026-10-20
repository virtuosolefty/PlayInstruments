/**
 * AppModals — extracted from App.jsx
 *
 * Manages all overlay dialogs: first-run welcome, dev tuning panel, error toast.
 */

import { memo, useEffect } from 'react';
import FirstRun from './FirstRun.jsx';
import TuningPanel from './TuningPanel.jsx';
import Icon from './Icon.jsx';

/**
 * An error, announced (role="alert") and kept until it is closed: an error you
 * have not read should not vanish. A real Close button, and Escape, so a
 * keyboard can dismiss it; clicking the message still closes it too.
 */
function ErrorToast({ error, onClose }) {
  useEffect(() => {
    // Escape closes the message only when nothing else is open: a dialog's own Escape must not take an unread error with it.
    const escape = event => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      onClose();
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [onClose]);
  return (
    <div className="toast" role="alert">
      <Icon name="warning" size={16} />
      <span onClick={onClose}>{error}</span>
      <button type="button" className="toast-close" aria-label="Close message" onClick={onClose}><Icon name="close" size={14} /></button>
    </div>
  );
}

const AppModals = memo(function AppModals({
  showFirstRun,
  onFirstRunDone,
  onBeginner,
  practiceInstrument,
  onInstrumentChange,
  onSetup,
  midiState,
  profile,
  keyWindow,
  onConnectMidi,
  isDev,
  error,
  onErrorClose,
}) {
  return (
    <>
      {showFirstRun && (
        <FirstRun
          onBeginner={onBeginner}
          practiceInstrument={practiceInstrument}
          onInstrumentChange={onInstrumentChange}
          onSetup={onSetup}
          midiState={midiState}
          profile={profile}
          window={keyWindow}
          onConnectMidi={onConnectMidi}
          onDone={onFirstRunDone}
        />
      )}

      {isDev && <TuningPanel />}

      {error && <ErrorToast error={error} onClose={onErrorClose} />}
    </>
  );
});

export default AppModals;
