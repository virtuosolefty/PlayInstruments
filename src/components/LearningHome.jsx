import Listbox from './Listbox.jsx';
import Icon from './Icon.jsx';
import { InstrumentIcon } from './StudioHeader.jsx';
import { chooseVariant, familyOf, instrumentInfo } from '../lib/instruments.js';
import InstrumentButtons from './InstrumentButtons.jsx';
import TypeSwitch from './TypeSwitch.jsx';
import { dayKey } from '../lib/learning/streaks.js';
import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { pieceDetails, weeklyPractice, sharedLessonUrl } from '../lib/learning/discovery.js';
import DiscoverPieces from './DiscoverPieces.jsx';
import TonightPractice from './TonightPractice.jsx';
import { Stars } from './PathTab.jsx';
import { exportHistory } from '../lib/app/storage.js';
import { lessonPurpose } from '../lib/learning/learning.js';

export function LearningSummary({ learning, state, onOpen }) {
  const guided = Object.values(learning.record.completed).filter(item => item.guided).length;
  return <section className="learning-summary">
    <h3>Small steps. Visible progress.</h3>
    <p>{state.finishedCount} {state.finishedCount === 1 ? 'lesson' : 'lessons'} finished · {state.passedCount} checks passed</p>
    <button onClick={onOpen}>Continue your learning path →</button>
    <p className="hint">Finishing a lesson opens the next one. A check at the written tempo shows how well you know it.</p>
  </section>;
}

export default function LearningHome({ learning, path, instrument, onInstrument, onExplore, onLibrary, days, settings, setSettings, preview, onPick, onFavorite, onBackup, storageProblem }) {
  const base=import.meta.env.BASE_URL;
  const heading = useRef(null);
  const [message,setMessage]=useState('');
  const [sessionSize,setSessionSize]=useState('full');
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const { record, entries, recommendedId } = learning;
  const saved = entries.find(e => e.id === record.lessonId);
  const savedPassed = path.state.exercises[saved?.id]?.passed;
  const current = saved && !record.daily?.complete && (!savedPassed || record.step !== 'check') ? saved : entries.find(e => e.id === recommendedId);
  const resume = !!saved && current?.id === saved.id;
  const stage = path.state.stages.find(s => s.exercises.includes(current?.id));
  const stageNumber = path.state.stages.indexOf(stage) + 1;
  const stageDone = stage?.entries.filter(entry => entry.finished).length ?? 0;
  const guided = Object.values(record.completed).filter(item => item.guided).length;
  const dailyComplete = record.daily?.complete && record.daily.day === dayKey();
  const detail=pieceDetails(current);
  const purpose = lessonPurpose(current, path.state.stages, entries);
  const week=weeklyPractice(days,settings.weeklyPracticeGoal);
  const completedAny=guided>0||path.state.finishedCount>0;
  const share=async()=>{
    try { await navigator.clipboard.writeText(sharedLessonUrl(instrument,current.id));setMessage('Lesson link copied. Your progress stays private.'); }
    catch {setMessage('Copy this lesson link: '+sharedLessonUrl(instrument,current.id));}
  };
  const backup=()=>{
    const url=URL.createObjectURL(new Blob([exportHistory()],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`practice-deck-${dayKey()}.json`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Backup download requested. Keep it somewhere safe.');
  };
  return <main className="learning-home" aria-labelledby="learning-home-title">
    <div className="learning-home-inner">
      <header className="learning-home-heading">
        <div><h1 id="learning-home-title" ref={heading} tabIndex={-1}>{resume?<>A little more music <em>today.</em></>:<>A clear path to your <em>first song.</em></>}</h1><p>{resume?`Pick up ${current.title} where you left off. Your place is waiting.`:(instrument==='drums'?'Find each drum, play a beat, and make it your own.':'Find your notes, play a phrase, and make it your own.')}</p></div>
        <div className="learning-instrument-choice"><InstrumentButtons className="learning-instruments" label="Learning instrument" current={instrument} onPick={value => onInstrument(chooseVariant(settings.variants, value))} content={value => <><InstrumentIcon instrument={value}/>{instrumentInfo(value).label}</>} /><TypeSwitch instrument={instrument} onChange={onInstrument} /></div>
      </header>
      {dailyComplete && <div className="daily-finished" role="status"><strong>Today’s practice is complete.</strong><span>You worked through {record.daily.ids.length} {record.daily.ids.length === 1 ? 'piece' : 'pieces'}. Your next lesson is ready whenever you are.</span></div>}
      <div className="learning-home-grid">
        <section className="next-lesson-card">
          <div className="lesson-hero-art" data-family={familyOf(instrument)} style={{ backgroundImage: `url(${base}media/${instrument}-studio.png)` }} aria-hidden="true" />
          {stage && <div className="path-strip"><strong>Stage {stageNumber} of {path.state.stages.length}</strong><ol aria-label={`${stageDone} of ${stage.entries.length} lessons finished in ${stage.name}`}>{stage.entries.map(entry => <li key={entry.id} className={entry.id === current?.id ? 'current' : entry.finished ? 'done' : undefined} title={entries.find(e => e.id === entry.id)?.title} />)}</ol><span aria-hidden="true">{stageDone} / {stage.entries.length} lessons</span></div>}
          <div className="learning-card-meta"><span className="eyebrow">{resume ? 'PICK UP WHERE YOU LEFT OFF' : 'START HERE'}</span><span>{stage?.name ?? 'Your next lesson'}</span></div>
          <h2>{current?.title ?? 'Preparing your lessons…'}</h2>
          <p className="next-skill">{detail.skill || 'Find your first note and build a short phrase, one step at a time.'}</p>
          <div className="next-piece-facts"><span>{detail.level}</span><span>{detail.length}</span><span>{resume?`Next: ${{sound:'check your sound',note:'find your first note',listen:'hear the phrase',follow:'follow the notes',practice:'build your rhythm',check:'check your progress'}[record.step]}`:'No rush. The notes can wait.'}</span></div>
          {record.completed[current?.id]?.comfortableRate > 0 && <p className="comfortable-best">Your best comfortable tempo: {Math.round(record.completed[current.id].comfortableRate * 100)}%</p>}
          <div className="lesson-method"><span>01 <b>Hear it</b></span><span>02 <b>{instrument==='drums'?'Find the drums':instrument==='tabla'?'Find the bols':'Find the notes'}</b></span><span>03 <b>Build a rhythm</b></span></div>
          <button className="primary" disabled={!current} onClick={() => learning.startLesson(current.id)}>{resume ? 'Continue learning' : record.lessonId ? 'Start the next lesson' : 'Start my first lesson'} <span aria-hidden="true">→</span></button>
          <p className="lesson-connection">{purpose.why}</p>
          <div className="next-secondary"><button disabled={!current} onClick={()=>preview.play(current)}>{preview.id===current?.id?(preview.loading?'Loading preview…':'■ Stop preview'):'▷ Hear a short preview'}</button><button disabled={!current} onClick={share}>Copy lesson link</button></div>
          <span className="learning-save-note">{storageProblem?'Your browser could not save recent changes. This session may not be available after you leave.':'Your place is saved on this device. Nothing starts until you’re ready.'}</span>
        </section>
        <TonightPractice learning={learning} path={path} size={sessionSize} onSize={setSessionSize} complete={dailyComplete} />
      </div>
      <section className="weekly-practice" aria-label="Weekly practice goal"><div><h2>{week.count>=week.goal?'You made room for music.':`${week.count} of ${week.goal} practice days this week`}</h2><p>Finish a run or practise for three minutes to count a day. Rest days are welcome.</p></div><div className="week-days" aria-label={`${week.count} practice days this week`}>{week.days.map((day,i)=><span key={day.date} className={`${day.done?'done':''} ${day.today?'today':''}`} title={`${day.date}${day.done?': practised':day.future?': coming up':': not yet'}`}><small>{['M','T','W','T','F','S','S'][i]}</small><b role="img" aria-label={`${day.date}: ${day.done?'practised':day.future?'coming up':'not yet'}`} /></span>)}</div><label>Weekly goal<Listbox label="Weekly practice days" value={week.goal} options={[2,3,5].map(n=>({value:n,label:`${n} days`}))} onChange={v=>setSettings(s=>({...s,weeklyPracticeGoal:+v}))} /></label></section>
      <DiscoverPieces entries={entries} instrument={instrument} favorites={settings.favoritePieces??[]} onFavorite={onFavorite} onPick={onPick} preview={preview}/>
      <section className="learning-roadmap" aria-labelledby="roadmap-title">
        <header><div><h2 id="roadmap-title">Your {instrument} path</h2></div><p>{path.state.finishedCount} / {path.state.total} lessons finished · {path.state.passedCount} checks passed</p></header>
        <p className="learning-key"><span><i className="lesson-mark done"><Icon name="check" size={12} /></i>Finished: the next lesson is open</span><span><Stars count={3} />How well you know it</span></p>
        <details className="learning-rule"><summary>How lessons open, and what the stars mean</summary><p><strong>Finish a lesson and the next one opens.</strong> Any complete run counts: at a slower speed, or with the notes waiting for you. Stars say how well you know it: <strong>3 stars at 100% speed</strong> passes its check, and <strong>4 stars</strong> masters it. You can explore library pieces at any time.</p></details>
        <div className="learning-stages">{path.state.stages.map((item, index) => {
          const isCurrent = item.id === stage?.id;
          return <details key={item.id} open={isCurrent || undefined} className={`${item.finished ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}>
            <summary><span className="learning-stage-number">{item.finished ? <Icon name="check" size={14} /> : String(index + 1).padStart(2,'0')}</span><span><strong>{item.name}</strong><small>{item.goal}</small></span><span className="stage-state">{isCurrent ? 'You are here' : item.cleared ? 'Mastered' : item.finished ? 'Finished' : item.unlocked ? 'Available' : 'Coming up'}</span></summary>
            <div className="learning-stage-lessons">{item.entries.map(entry => <button key={entry.id} className={entry.id === current?.id ? 'next' : undefined} disabled={!entry.unlocked} onClick={() => learning.startLesson(entry.id)}><i className={`lesson-mark ${entry.finished ? 'done' : entry.unlocked ? 'open' : 'locked'}`} aria-hidden="true">{entry.finished ? <Icon name="check" size={12} /> : ''}</i><span>{entries.find(e => e.id === entry.id)?.title ?? entry.id}</span>{entry.id === current?.id ? <b className="lesson-next">{entry.finished ? 'Next · Play for stars' : 'Next · Start'} <span aria-hidden="true">→</span></b> : <Stars count={entry.bestStars} shown={entry.finished} />}<small>{entry.mastered ? 'Mastered' : entry.passed ? 'Check passed · aim for 4 stars' : entry.finished ? 'Finished · the check is there for stars' : record.completed[entry.id]?.guided ? 'Guided practice completed' : entry.unlocked ? 'Ready to learn' : 'Finish the lesson before this one'}</small></button>)}</div>
          </details>;
        })}</div>
      </section>
      <section className="learning-backup"><div><h2>{storageProblem?'Saving needs your attention.':completedAny?'Keep the progress you’ve earned.':'Your practice, kept on this device.'}</h2><p>{storageProblem?'An export contains previously saved history. Recent unsaved changes may be missing.':'Download a backup to protect your lessons and history. Restore it from Progress on another browser.'}</p></div><button onClick={backup}>Download progress backup</button><button onClick={onBackup}>Restore a backup</button></section>
      {message&&<p className="home-message" role="status">{message}</p>}
      <footer className="learning-home-footer"><span>Make room for curiosity, too.</span><button onClick={onExplore}>Explore freely</button><button onClick={onLibrary}>Browse the library</button></footer>
      <div className="learning-public-links"><a href={`${base}welcome/`}>About Practice Deck</a><a href={`${base}about-data/`}>Your data & compatibility</a></div>
    </div>
  </main>;
}
