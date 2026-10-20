import { useEffect, useMemo, useState } from 'react';
import { MODES } from './usePracticeEngine.js';
import { DEFAULT_SETTINGS } from '../lib/app/settings.js';
import { INSTRUMENTS, instrumentInfo, instrumentKit, usesKit } from '../lib/instruments.js';

const isLesson = entry => (entry.tags ?? []).includes('path');

/** Ctrl+K (Cmd+K on a Mac) opens and closes the palette, unless another dialog is up. */
function usePaletteKey(setOpen) {
  useEffect(() => {
    const onKeyDown = e => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'k') return;
      const other = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some(d => !d.classList.contains('palette'));
      if (other) return;
      e.preventDefault();
      setOpen(open => !open);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);
}

/**
 * Everything the palette can do, built from the studio's own functions so a
 * command and the control it names can never do different things.
 */
export function useCommandPalette(ctx) {
  const [open, setOpen] = useState(false);
  usePaletteKey(setOpen);
  const { settings, setSettings, instrument, library, learning, engine, score, freePlay, focus } = ctx;
  const commands = useMemo(() => {
    if (!open) return [];
    const kits = INSTRUMENTS.filter(usesKit).map(id => instrumentKit(id)).filter(Boolean);
    const piece = (entry, owner) => ({
      id: `piece-${entry.id}`, group: 'piece', title: entry.title,
      detail: [instrumentInfo(owner).label, entry.composer && entry.composer !== 'Exercise' ? entry.composer : null].filter(Boolean).join(' · '),
      keywords: [owner, ...(entry.tags ?? [])],
      run: () => (owner === 'piano' ? ctx.selectPianoSong(entry) : ctx.selectStudy(entry.id)),
    });
    // Kits can share a study (the bass borrows guitar pieces): one entry each, under its first instrument.
    const pieces = [...new Map([
      ...library.filter(e => !isLesson(e)).map(e => piece(e, 'piano')),
      ...kits.flatMap(kit => (kit.songs ?? kit.studies).map(e => piece(e, kit.id))),
    ].reverse().map(c => [c.id, c])).values()].reverse();
    const byId = new Map([...library.map(e => [e.id, piece(e, 'piano')]), ...kits.flatMap(kit => kit.studies.map(e => [e.id, piece(e, kit.id)]))]);
    // Only what was chosen or starred: a kit's study counts once it is not the one every visitor starts on.
    const recentIds = [...new Set([settings.lastPianoId, ...kits.map(kit => settings[kit.studyKey] !== DEFAULT_SETTINGS[kit.studyKey] && settings[kit.studyKey]), ...(settings.favoritePieces ?? [])].filter(Boolean))];
    const recent = recentIds.map(id => byId.get(id)).filter(Boolean).map(c => ({ ...c, id: `recent-${c.id}`, group: 'recent' }));
    const lessons = (instrumentKit(instrument)?.lessons ?? library.filter(isLesson)).map(e => ({
      id: `lesson-${e.id}`, group: 'lesson', title: e.title, detail: `Lesson · ${instrumentInfo(instrument).label}`,
      // Its description's words too, so a lesson is found by what it is about (the handpan's Under the shell by underside).
      keywords: ['lesson', e.description ?? ''],
      run: () => learning.startLesson(e.id),
    }));
    const instruments = INSTRUMENTS.map(id => ({ id: `instrument-${id}`, group: 'instrument', title: instrumentInfo(id).label, detail: id === instrument ? 'Playing now' : 'Switch instrument', keywords: ['instrument'], run: () => ctx.changeInstrument(id) }));
    const screens = [
      { id: 'screen-home', title: 'Learning path', keywords: ['home', 'lessons'], run: learning.openHome },
      { id: 'screen-studio', title: 'Studio', keywords: ['practice'], run: () => ctx.changeWorkspace(false) },
      { id: 'screen-free', title: 'Free play', keywords: ['explore'], run: () => ctx.changeWorkspace(true) },
      { id: 'screen-library', title: 'Library', keywords: ['pieces', 'songs'], run: ctx.openLibrary },
      { id: 'screen-progress', title: 'Progress', keywords: ['backup', 'history'], run: ctx.openProgress },
      { id: 'screen-setup', title: 'Input & sound', keywords: ['midi', 'microphone', 'controller', 'setup'], run: ctx.openSetup },
      { id: 'screen-tuner', title: 'Tuner', keywords: ['tune'], run: ctx.openTuner },
    ].map(c => ({ ...c, group: 'screen' }));
    const studio = !!score && !freePlay && !learning.active && !learning.homeOpen;
    const set = patch => () => setSettings(s => ({ ...s, ...patch }));
    const actions = [
      studio && { id: 'action-play', title: engine.playing ? 'Pause' : 'Play', keys: ['Space'], run: () => (engine.playing ? engine.actions.pause() : engine.actions.play()) },
      studio && { id: 'action-listen', title: 'Listen mode', detail: 'Hear the piece', keys: ['1'], keywords: ['mode'], run: set({ mode: MODES.LISTEN }) },
      studio && { id: 'action-practice', title: 'Practice mode', detail: 'Play along in time', keys: ['2'], keywords: ['mode'], run: set({ mode: MODES.PRACTICE }) },
      studio && { id: 'action-wait', title: 'Wait for me', detail: 'The notes wait for you', keys: ['3'], keywords: ['mode'], run: set({ mode: MODES.WAIT }) },
      studio && { id: 'action-loop', title: settings.loop ? 'Stop looping' : 'Loop a passage', keys: ['['], keywords: ['repeat'], run: ctx.toggleLoop },
      studio && { id: 'action-metronome', title: settings.metronome ? 'Turn the metronome off' : 'Turn the metronome on', keys: [']'], keywords: ['click', 'beat'], run: () => setSettings(s => ({ ...s, metronome: !s.metronome })) },
      studio && { id: 'action-hear', title: 'Hear the phrase', keys: ['\\'], keywords: ['listen'], run: ctx.hearOrTry },
      studio && { id: 'action-focus', title: focus ? 'Leave Focus view' : 'Focus view', keywords: ['hide', 'full'], run: ctx.toggleFocus },
      !engine.audioReady && { id: 'action-sound', title: 'Turn on sound', keywords: ['audio'], run: ctx.startAudio },
      { id: 'action-theme', title: ctx.theme === 'dark' ? 'Light theme' : 'Dark theme', keywords: ['theme', 'appearance'], run: set({ theme: ctx.theme === 'dark' ? 'light' : 'dark' }) },
      { id: 'action-text', title: settings.textSize === 'large' ? 'Standard text size' : 'Larger text', keywords: ['font', 'size', 'appearance'], run: set({ textSize: settings.textSize === 'large' ? 'standard' : 'large' }) },
    ].filter(Boolean).map(c => ({ ...c, group: 'action' }));
    return [...recent, ...pieces, ...lessons, ...instruments, ...screens, ...actions];
    // ctx's functions are recreated each render; the palette reads them when it opens and while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, library, settings, instrument, learning.active, learning.homeOpen, engine.playing, engine.audioReady, score, freePlay, focus, ctx.theme]);
  return { open, setOpen, commands };
}
