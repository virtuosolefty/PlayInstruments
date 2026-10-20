/**
 * The choices in a workspace's Exercise list: the instrument's lessons, then
 * its songs (on the drums, its beats) under a heading of their own, so a tune
 * someone came for is not lost among the scales.
 *
 * @param {{ lessons: object[], songs: object[], songsLabel: string }} kit from instruments.js
 * @returns {{ label: string, options: { value: string, label: string }[] }[]} for a Listbox's `groups`
 */
export function studyGroups(kit) {
  const option = study => ({ value: study.id, label: study.title });
  return [
    { label: 'Lessons', options: kit.lessons.map(option) },
    { label: kit.songsLabel, options: kit.songs.map(option) },
  ];
}
