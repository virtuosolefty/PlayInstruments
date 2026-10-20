import { expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import LessonGuide, { LessonDock } from './LessonGuide.jsx';
import { GUITAR_STUDIES, GUITAR_PATH_STAGES } from '../lib/strings/guitar.js';

it('renders the lesson goal and phone action while a lesson is loading', () => {
  const lesson = GUITAR_STUDIES[0];
  const learning = { lesson, entries: GUITAR_STUDIES, ready: false, record: { step: 'note', rate: .65 } };
  const engine = { sessionRef: { current: null } };
  const path = { state: { stages: GUITAR_PATH_STAGES, exercises: {} } };
  expect(renderToString(<LessonGuide learning={learning} engine={engine} path={path} instrument="guitar" />)).toContain('Find all six open strings');
  expect(renderToString(<LessonDock learning={learning} engine={engine} instrument="guitar" />)).toContain('Preparing your lesson');
});
