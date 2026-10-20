import { useSyncExternalStore } from 'react';

/**
 * shownModel.js — which model the whole-instrument view is showing in place of the instrument practised, if any.
 *
 * WholeModels.jsx says so whenever it changes; the app listens, so what you hear is the instrument you see (a bass
 * guitar sounds like a bass, an electronic kit like an electronic kit). Null while the instrument practised is the
 * one on the stage.
 */

let current = null;
const listeners = new Set();

export function setShownModel(id) {
  const next = id ?? null;
  if (next === current) return;
  current = next;
  listeners.forEach(listener => listener());
}

export const shownModel = () => current;

const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };

/** The id of the model shown in place of the instrument practised, or null. */
export const useShownModel = () => useSyncExternalStore(subscribe, shownModel, shownModel);
