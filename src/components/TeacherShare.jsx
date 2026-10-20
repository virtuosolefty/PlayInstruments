import { useState } from 'react';
import Icon from './Icon.jsx';
import { exportHistory, getAllBestStars } from '../lib/app/storage.js';
import { teacherReport } from '../lib/learning/teacherReport.js';
import { dayKey } from '../lib/learning/streaks.js';

/**
 * "Share with a teacher": a readable progress page, made on this device and
 * saved as one HTML file the pupil can send, or open and print. No account and
 * no server; the teacher needs nothing but a browser.
 *
 * @param {{ pieces: object[] }} props every piece and study the app knows, for titles and bar numbers
 */
export default function TeacherShare({ pieces }) {
  const [note, setNote] = useState(null);
  const download = () => {
    try {
      const { data } = JSON.parse(exportHistory());
      const html = teacherReport({ songs: data?.songs ?? {}, days: data?.days ?? {}, pieces: new Map(pieces.map(piece => [piece.id, piece])), stars: getAllBestStars().stars });
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `practice-progress-${dayKey()}.html`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNote({ tone: 'ok', text: 'Progress page saved to your downloads. Send it to your teacher, or open it and print it.' });
    } catch (error) {
      console.error('[teacher] could not make the progress page:', error);
      setNote({ tone: 'bad', text: 'The progress page could not be made. Your practice history is unchanged; try again, or use Export below.' });
    }
  };
  return (
    <div className="section teacher-share">
      <h2 className="section-title">Share with a teacher</h2>
      <p className="hint">A page of your practice days, the pieces you have played with your best results, and the bars that keep going wrong. It is made here and nothing is uploaded.</p>
      <button type="button" onClick={download}><Icon name="download" size={14} /> Download a progress page</button>
      {note && <p className={`hint teacher-note ${note.tone}`} role="status">{note.text}</p>}
    </div>
  );
}
