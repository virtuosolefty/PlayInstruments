/**
 * "History for Ode to Joy cleared · Undo": a destructive action that can be
 * taken back for a few seconds instead of asking first (ui-ux-pro-max
 * undo-support). The status region stays mounted and only its text changes,
 * so screen readers announce it; it never moves the focus. The Undo button is
 * a real button for the keyboard. Nothing shows while `message` is empty.
 *
 * @param {{ message: string, onUndo: () => void }} props
 */
export default function UndoToast({ message, onUndo }) {
  return (
    <div className="undo-region" role="status" aria-live="polite">
      {message && (
        <div className="toast undo-toast">
          <span>{message}</span>
          <button type="button" className="undo-button" onClick={onUndo}>Undo</button>
        </div>
      )}
    </div>
  );
}
