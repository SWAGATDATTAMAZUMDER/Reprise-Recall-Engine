'use client';

import Flashcard from './Flashcard';
import {
  type FlashcardRecord,
  type DeckRecord,
  type MasteryStats,
  type Rating,
  type SM2State,
} from '@/lib/storage';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CardAreaProps {
  mounted:         boolean;
  deckCards:       FlashcardRecord[];
  deckStats:       MasteryStats;
  dueCount:        number;
  selectedDeck:    DeckRecord | undefined;
  isNewUser:       boolean;
  generatingDeck:  boolean;
  loadingMessage:  string;
  phaseVisible:    boolean;
  onRate:          (cardId: string, r: Rating, newSm2: SM2State) => void;
  onReset:         (cardId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CardArea({
  mounted,
  deckCards,
  deckStats,
  dueCount,
  selectedDeck,
  isNewUser,
  generatingDeck,
  loadingMessage,
  phaseVisible,
  onRate,
  onReset,
}: CardAreaProps) {
  return (
    <main className="flex-1 overflow-y-auto px-8 py-10">

      {/* ── Greeting ────────────────────────────────────────────────────── */}
      {mounted && deckCards.length > 0 && (
        <div className="mb-8 max-w-2xl">
          {dueCount === 0 && deckStats.hard === 0 && deckStats.moderate === 0 ? (
            <div className="rounded-xl border border-green-100 bg-green-50 px-5 py-4">
              <p className="text-base font-bold text-green-900">You&apos;re all caught up!</p>
              <p className="mt-1 text-sm text-green-700">
                Every card in this deck is mastered and scheduled for future review.
              </p>
            </div>
          ) : isNewUser ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
              <p className="text-base font-bold text-indigo-900">
                Welcome! Ready to master your first subject?
              </p>
              <p className="mt-1 text-sm text-indigo-600">
                Five sample decks are pre-loaded in the sidebar. Click any deck to begin.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
              <p className="text-base font-bold text-gray-900">Welcome back!</p>
              <p className="mt-1 text-sm text-gray-500">
                You have{' '}
                <strong className="text-gray-800">{dueCount}</strong>{' '}
                card{dueCount !== 1 ? 's' : ''} due for review in{' '}
                <strong className="text-gray-800">{selectedDeck?.title}</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Deck header ─────────────────────────────────────────────────── */}
      <div className="mb-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900">{selectedDeck?.title ?? ''}</h1>
        <p className="mt-0.5 text-sm text-gray-400">{deckCards.length} cards</p>
      </div>

      {/* ── Cards / loader / empty state ────────────────────────────────── */}
      <div className="flex max-w-2xl flex-col gap-6">
        {generatingDeck ? (

          /* Themed generation loader */
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-indigo-100 bg-white py-20 shadow-sm">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-indigo-500" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-indigo-300">
              REPRISE
            </span>
            <p className={`text-sm text-gray-400 transition-opacity duration-300 ${
              phaseVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              {loadingMessage}
            </p>
          </div>

        ) : deckCards.length === 0 ? (

          <div className="rounded-xl border-2 border-dashed border-gray-200 py-14 text-center text-gray-400">
            <p className="text-sm font-medium">No cards in this deck yet.</p>
            <p className="mt-1 text-xs">Upload a PDF to generate flashcards automatically.</p>
          </div>

        ) : (
          deckCards.map((record) => (
            <Flashcard
              key={record.id}
              card={record}
              initialRating={record.rating}
              initialSm2={record.sm2}
              onRate={(r, newSm2) => onRate(record.id, r, newSm2)}
              onReset={() => onReset(record.id)}
            />
          ))
        )}
      </div>
    </main>
  );
}
