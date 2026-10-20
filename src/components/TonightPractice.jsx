import Icon from './Icon.jsx';
import { dayKey } from '../lib/learning/streaks.js';
import { itemMinutes } from '../lib/practice/sessionLength.js';

const KIND = { warmup: 'Warm up', work: 'Your current lesson', preview: 'A preview', recital: 'Play for enjoyment', enjoyment: 'Play for enjoyment' };

/**
 * Today's practice as tonight's checklist, the way a practice stand opens
 * with what tonight holds: how long it takes, a ring of today's runs, and each
 * item with its minutes and a circle that ticks once today's practice has
 * moved past it.
 *
 * @param {object} props
 * @param {object} props.learning useLearningFlow's state
 * @param {object} props.path usePath's state (progress is today's runs against the goal)
 * @param {'short'|'full'} props.size
 * @param {(size: 'short'|'full') => void} props.onSize
 * @param {boolean} props.complete today's practice is finished
 */
export default function TonightPractice({ learning, path, size, onSize, complete }) {
  const { record, entries, dailyItems } = learning;
  const work = dailyItems.filter(item => item.kind === 'work').slice(0, 1);
  const shown = size === 'short' ? (work.length ? work : dailyItems.slice(0, 1)) : dailyItems;
  const today = record.daily?.day === dayKey() ? record.daily : null;
  const isDone = item => !!today && (today.complete || (today.ids.indexOf(item.songId) > -1 && today.ids.indexOf(item.songId) < today.index));
  const minutesOf = item => itemMinutes(entries.find(entry => entry.id === item.songId));
  const minutes = shown.reduce((sum, item) => sum + minutesOf(item), 0);
  const { done, goal } = path.progress;
  const filled = goal ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  return (
    <section className="daily-learning-card">
      <h2>Today’s practice</h2>
      <div className="tonight">
        <div className="tonight-ring" role="img" aria-label={`${done} of ${goal} runs today`} style={{ '--filled': `${filled}%` }}><b>{done}/{goal}</b></div>
        <div>
          <strong>Tonight, about {minutes} {minutes === 1 ? 'minute' : 'minutes'}.</strong>
          <p>{shown.length === 1 ? 'One short run.' : `${shown.length} short runs.`} Each one ticks off as you finish it.</p>
        </div>
      </div>
      <div className="practice-size" role="group" aria-label="Practice session length">
        <button aria-pressed={size === 'short'} onClick={() => onSize('short')}>One phrase</button>
        <button aria-pressed={size === 'full'} onClick={() => onSize('full')}>Full sequence</button>
      </div>
      <ol className="tonight-list">
        {shown.map(item => {
          const finished = isDone(item);
          return (
            <li key={item.songId} className={finished ? 'done' : undefined}>
              <span className="tick" aria-hidden="true">{finished && <Icon name="check" size={12} />}</span>
              <span className="kind">{KIND[item.kind]}{finished && <span className="sr-only">, done</span>}</span>
              <strong>{item.label}</strong>
              <span className="mins">{minutesOf(item)} min</span>
            </li>
          );
        })}
      </ol>
      <button onClick={() => learning.startDaily(size)} disabled={!dailyItems.length}>{complete ? 'Practise again' : 'Start today’s practice'}</button>
      <p className="daily-return">Next time: {dailyItems.find(item => item.kind === 'preview')?.label ?? 'return to a familiar phrase, then explore a tune you enjoy'}.</p>
    </section>
  );
}
