/**
 * pagesBase.mjs — the path GitHub Pages serves the site from, for vite.config.js and build-public-pages.mjs.
 *
 * Pages serves a project site from /<repository name>/. GitHub Actions passes the repository as GITHUB_REPOSITORY
 * ("owner/name"), so the site follows the repository if it is ever renamed; REPOSITORY is the name to use outside
 * Actions. A local build or dev server is served from /.
 */

export const REPOSITORY = 'PlayInstruments';

export const pagesBase = (env = process.env) =>
  (env.GITHUB_PAGES === 'true' ? `/${env.GITHUB_REPOSITORY?.split('/')[1] || REPOSITORY}/` : '/');
