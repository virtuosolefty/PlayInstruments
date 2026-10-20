import { describe, expect, it } from 'vitest';
import { creditLine, MODEL_CREDITS, modelCredit } from './modelCredits.js';

describe('credits for the 3D instruments', () => {
  it('credits each downloaded model, its author and its licence', () => {
    expect(MODEL_CREDITS.map(c => c.model)).toEqual(['guitar', 'violin', 'cello', 'guitar-bass', 'violin-electric', 'cello-antique', 'drums-acoustic', 'drums-electronic', 'piano-grand', 'tabla', 'veena']);
    for (const credit of MODEL_CREDITS) {
      expect(credit.source).toMatch(/^https:\/\/sketchfab\.com\/3d-models\/[a-z0-9-]+-[0-9a-f]{32}$/);
      expect(credit.authorUrl).toMatch(/^https:\/\/sketchfab\.com\//);
      // The tabla alone is non-commercial: the player chose it and keeps the app free.
      const nc = credit.model === 'tabla';
      expect(credit.license).toBe(nc ? 'CC BY-NC 4.0' : 'CC BY 4.0');
      expect(credit.licenseUrl).toBe(nc ? 'https://creativecommons.org/licenses/by-nc/4.0/' : 'https://creativecommons.org/licenses/by/4.0/');
      expect(credit.title).toBeTruthy();
      expect(credit.author).toBeTruthy();
    }
  });

  it('files each model under the instrument it is shown with', () => {
    expect(MODEL_CREDITS.filter(c => c.instrument === 'drums').map(c => c.model)).toEqual(['drums-acoustic', 'drums-electronic']);
    expect(modelCredit('guitar-bass').instrument).toBe('guitar');
    expect(modelCredit('piano-grand')).toMatchObject({ instrument: 'piano', author: 'EastSeaSaltfishnet' });
    expect(modelCredit('piano-grand').changes).toContain('each key made a part of its own');
  });

  it('says what was changed, as the licence asks', () => {
    const line = creditLine(modelCredit('violin'));
    expect(line).toBe('"Violin" (https://sketchfab.com/3d-models/violin-0162dea1b1044cd281c57af5e5fc2046) by Voldepreuss (https://sketchfab.com/Voldepreuss), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Modified: the strings between nut and bridge replaced, scaled and re-encoded for Practice Deck.');
  });

  it('says the strings were replaced on every model whose strings the stage draws', () => {
    for (const id of ['guitar', 'violin', 'cello', 'guitar-bass', 'violin-electric', 'cello-antique']) {
      expect(modelCredit(id).changes, id).toContain('the strings between nut and bridge replaced, scaled and re-encoded');
    }
  });

  it('says that each drum of a kit was lifted out as its own part, and claims no more than that', () => {
    expect(creditLine(modelCredit('drums-acoustic'))).toMatch(/Modified: each drum made a part of its own, shells and cymbals recoloured, platform and stool removed, scaled and re-encoded for Practice Deck\.$/);
    expect(creditLine(modelCredit('drums-electronic'))).toMatch(/Modified: its trailing cable left out, each drum made a part of its own, scaled and re-encoded, surface geometry simplified, dark finishes adjusted for the studio lights for Practice Deck\.$/);
    // Nothing on a kit was replaced, as the strings of a played string instrument are.
    for (const id of ['drums-acoustic', 'drums-electronic']) expect(modelCredit(id).changes, id).not.toMatch(/replaced/);
  });

  it('says so where a part of a model was left out', () => {
    expect(modelCredit('drums-electronic').changes).toBe('its trailing cable left out, each drum made a part of its own, scaled and re-encoded, surface geometry simplified, dark finishes adjusted for the studio lights');
  });

  it('has no credit for an instrument without a model', () => {
    expect(modelCredit('piano')).toBeNull();
  });
});
