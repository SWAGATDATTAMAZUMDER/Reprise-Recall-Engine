'use client';

import { useState } from 'react';
import 'katex/dist/contrib/mhchem';
import { InlineMath, BlockMath } from 'react-katex';
import { CheckCircle } from 'lucide-react';
import type { Rating, SM2State } from '@/lib/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlashcardData {
  subject?: string;
  question: string;
  hint1: string;
  hint2: string;
  solution: string;
}

// ─── SM-2 Algorithm ───────────────────────────────────────────────────────────

function sm2(state: SM2State, quality: number): SM2State {
  // quality: 2 = Hard, 4 = Moderate, 5 = Easy
  // EF is preserved for potential future adaptive logic; intervals are fixed.
  const newEf = Math.max(
    1.3,
    state.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Fixed review schedule: Hard → 1 day, Moderate → 3 days, Easy → 6 days
  const interval = quality >= 5 ? 6 : quality >= 4 ? 3 : 1;
  const reps     = quality < 3 ? 0 : state.reps + 1;

  return { ef: newEf, interval, reps };
}

// ─── Math Text Renderer ───────────────────────────────────────────────────────
// Parses $$...$$ (block) and $...$ (inline) LaTeX in plain strings.

function MathText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    const raw = match[0];
    if (raw.startsWith('$$')) {
      parts.push(<BlockMath key={key++} math={raw.slice(2, -2).trim()} />);
    } else {
      parts.push(<InlineMath key={key++} math={raw.slice(1, -1).trim()} />);
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

// ─── Background colour map ────────────────────────────────────────────────────

const BG: Record<Rating | 'none', string> = {
  none:     'bg-white',
  hard:     'bg-red-50',
  moderate: 'bg-yellow-50',
  easy:     'bg-green-50',
};

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_SM2: SM2State = { ef: 2.5, interval: 1, reps: 0 };

export default function Flashcard({
  card,
  initialRating = null,
  initialSm2 = DEFAULT_SM2,
  onRate,
  onMaster,
  onReset,
}: {
  card: FlashcardData;
  initialRating?: Rating | null;
  initialSm2?: SM2State;
  onRate?: (r: Rating, newSm2: SM2State) => void;
  onMaster?: () => void;
  onReset?: () => void;
}) {
  const [stage, setStage] = useState(0);
  const [rating, setRating] = useState<Rating | null>(initialRating);
  const [sm2State, setSm2State] = useState<SM2State>(initialSm2);

  function rate(r: Rating) {
    const quality = r === 'hard' ? 2 : r === 'moderate' ? 4 : 5;
    const newSm2 = sm2(sm2State, quality);
    setSm2State(newSm2);
    setRating(r);
    onRate?.(r, newSm2);  // persist to LocalStorage via parent
  }

  function master() {
    // Mark easy from any stage — no need to see hints or solution
    const newSm2 = sm2(sm2State, 5);
    setSm2State(newSm2);
    setRating('easy');
    onRate?.('easy', newSm2);
    onMaster?.();
  }

  function reset() {
    setStage(0);
    setRating(null);
    setSm2State(DEFAULT_SM2); // wipe interval/reps so card is truly unstarted
    onReset?.();
  }

  const bg = BG[rating ?? 'none'];

  return (
    <div
      className={`
        flex flex-col gap-5 rounded-2xl border border-gray-200 p-6 shadow-md
        transition-colors duration-500 ${bg}
      `}
    >
      {/* Top row: subject tag + Mark as Mastered */}
      <div className="flex items-center justify-between">
        {card.subject ? (
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
            {card.subject}
          </span>
        ) : (
          <span />
        )}
        {!rating && (
          <button
            onClick={master}
            title="Mark as Mastered"
            className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            <CheckCircle size={13} strokeWidth={2.5} />
            Mastered
          </button>
        )}
      </div>

      {/* Question */}
      <p className="text-center text-xl font-medium leading-relaxed text-gray-900">
        <MathText text={card.question} />
      </p>

      {/* Hint 1 — hidden once solution is open */}
      {stage >= 1 && stage < 3 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="mb-0.5 block font-semibold">Hint 1</span>
          <MathText text={card.hint1} />
        </div>
      )}

      {/* Hint 2 — hidden once solution is open */}
      {stage >= 2 && stage < 3 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="mb-0.5 block font-semibold">Hint 2</span>
          <MathText text={card.hint2} />
        </div>
      )}

      {/* Solution */}
      {stage === 3 && (
        <div className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800">
          <span className="mb-1 block font-semibold">Solution</span>
          <MathText text={card.solution} />
        </div>
      )}

      {/* ── Action Area ── */}
      <div className="mt-auto flex flex-col items-center gap-3">

        {stage < 3 && (
          <div className="flex flex-wrap justify-center gap-2">
            {/* Show Hint 1 — visible until hint 1 is revealed */}
            {stage < 1 && (
              <button
                onClick={() => setStage(1)}
                className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
              >
                Show Hint 1
              </button>
            )}
            {/* Show Hint 2 — visible until hint 2 is revealed; jumps past hint 1 if needed */}
            {stage < 2 && (
              <button
                onClick={() => setStage(2)}
                className="rounded-full border border-blue-300 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100"
              >
                Show Hint 2
              </button>
            )}
            <button
              onClick={() => setStage(3)}
              className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Show Answer
            </button>
          </div>
        )}

        {/* SM-2 rating buttons — instant colour feedback + persists to storage */}
        {stage === 3 && !rating && (
          <div className="flex gap-3">
            <button
              onClick={() => rate('hard')}
              className="rounded-full bg-red-100 px-5 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200"
            >
              Hard
            </button>
            <button
              onClick={() => rate('moderate')}
              className="rounded-full bg-yellow-100 px-5 py-2 text-sm font-semibold text-yellow-700 transition-colors hover:bg-yellow-200"
            >
              Moderate
            </button>
            <button
              onClick={() => rate('easy')}
              className="rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-200"
            >
              Easy
            </button>
          </div>
        )}

        {/* Post-rating: next review info + reset */}
        {rating && (
          <div className="flex w-full items-center justify-between text-xs text-gray-500">
            <span>
              Next review in{' '}
              <strong
                className={
                  rating === 'easy'
                    ? 'text-green-600'
                    : rating === 'hard'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }
              >
                {sm2State.interval} day{sm2State.interval !== 1 ? 's' : ''}
              </strong>
            </span>
            <button
              onClick={reset}
              className="underline transition-colors hover:text-gray-800"
            >
              Reset card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
