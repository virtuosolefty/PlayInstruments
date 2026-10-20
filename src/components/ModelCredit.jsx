import { modelCredit } from '../lib/stage/modelCredits.js';

/**
 * "3D model by <artist>" for a downloaded model on the stage, the artist's
 * name first and linked to their page. CC BY asks for the credit; the people
 * who made these instruments deserve to be seen where their work is, not only
 * in Help. Nothing for a model built in code.
 */
export default function ModelCredit({ id, className = '' }) {
  const credit = modelCredit(id);
  if (!credit) return null;
  return <span className={`model-credit ${className}`}>
    3D model by <a href={credit.authorUrl} target="_blank" rel="noopener noreferrer" title={`“${credit.title}” by ${credit.author}, ${credit.license}`}><strong>{credit.author}</strong></a>
  </span>;
}
