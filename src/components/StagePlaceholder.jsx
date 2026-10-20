/**
 * What a stage shows while its code or model loads: a faint outline of the
 * instrument that is coming (strings and frets, a fingerboard, drum heads),
 * a slow shimmer, and the words. It takes the stage's own size, so nothing
 * jumps when the real one arrives.
 */
export default function StagePlaceholder({ shape = 'strings', className = '', children }) {
  return <div className={`guitar-stage-loading stage-placeholder ${shape} ${className}`} role="status">
    <i className="outline" aria-hidden="true" />
    <span>{children}</span>
  </div>;
}
