'use client';

import { type RefObject, useState } from 'react';
import { HelpCircle, Loader2, Trash2 } from 'lucide-react';
import {
  computeMasteryStats,
  type FlashcardRecord,
  type DeckRecord,
  type MasteryStats,
} from '@/lib/storage';

// ─── StatPill ─────────────────────────────────────────────────────────────────

function StatPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: 'green' | 'yellow' | 'red';
}) {
  const cls = {
    green:  'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red:    'bg-red-50 text-red-700',
  }[color];
  return (
    <div className={`flex-1 rounded-lg px-2 py-1.5 text-center ${cls}`}>
      <div className="text-base font-bold leading-none">{count}</div>
      <div className="mt-0.5 text-xs">{label}</div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  decks:           DeckRecord[];
  cards:           FlashcardRecord[];
  selectedDeckId:  string;
  deckStats:       MasteryStats;
  generatingDeck:  boolean;
  generationDepth: 3 | 5 | 10;
  loadingMessage:  string;
  phaseVisible:    boolean;
  fileInputRef:    RefObject<HTMLInputElement | null>;
  onSelectDeck:    (id: string) => void;
  onDeleteDeck:    (id: string) => void;
  onDepthChange:   (d: 3 | 5 | 10) => void;
  onUploadClick:   () => void;
  onHelpClick:     () => void;
  onFileChange:    (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({
  decks,
  cards,
  selectedDeckId,
  deckStats,
  generatingDeck,
  generationDepth,
  loadingMessage,
  phaseVisible,
  fileInputRef,
  onSelectDeck,
  onDeleteDeck,
  onDepthChange,
  onUploadClick,
  onHelpClick,
  onFileChange,
}: SidebarProps) {
  const [showPdfTip, setShowPdfTip] = useState(false);

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">

      {/* ── Dashboard ─────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Dashboard
          </h3>
        </div>
        <div className="flex gap-2">
          <StatPill label="Easy" count={deckStats.easy}     color="green"  />
          <StatPill label="Mod"  count={deckStats.moderate} color="yellow" />
          <StatPill label="Hard" count={deckStats.hard}     color="red"    />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {deckStats.unrated} card{deckStats.unrated !== 1 ? 's' : ''} unrated
        </p>
      </div>

      {/* ── Library ───────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          My Library
        </h3>
        <ul className="space-y-1">
          {decks.map((deck) => {
            const dc     = cards.filter((c) => c.deckId === deck.id);
            const ds     = computeMasteryStats(dc);
            const active = selectedDeckId === deck.id;
            return (
              <li key={deck.id} className="flex items-center gap-1">
                <button
                  onClick={() => onSelectDeck(deck.id)}
                  className={`min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="block truncate text-sm font-medium">{deck.title}</span>
                  {dc.length === 0 || ds.easy + ds.moderate + ds.hard === 0 ? (
                    <span className="block mt-0.5 text-xs text-gray-400">
                      {dc.length} cards &middot; Unstarted
                    </span>
                  ) : (
                    <span className="block mt-0.5 text-xs">
                      <span className="text-green-600">{ds.easy} easy</span>
                      <span className="mx-1 text-gray-300">&bull;</span>
                      <span className="text-yellow-600">{ds.moderate} mod</span>
                      <span className="mx-1 text-gray-300">&bull;</span>
                      <span className="text-red-500">{ds.hard} hard</span>
                    </span>
                  )}
                </button>
                <button
                  onClick={() => onDeleteDeck(deck.id)}
                  title={`Delete ${deck.title}`}
                  className="shrink-0 rounded p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}

          {/* In-progress placeholder */}
          {generatingDeck && (
            <li className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2.5 text-xs text-indigo-400">
              <Loader2 size={13} className="shrink-0 animate-spin" />
              <span className={`transition-opacity duration-300 ${phaseVisible ? 'opacity-100' : 'opacity-0'}`}>
                {loadingMessage}
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* ── Upload footer ─────────────────────────────────────────────────── */}
      <div className="space-y-2 border-t border-gray-100 px-5 py-4">
        {!generatingDeck && (
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Generation Depth
              </label>
              <button
                onClick={() => setShowPdfTip(true)}
                className="rounded-full text-indigo-400 hover:text-indigo-600 transition-colors"
                title="PDF requirements"
              >
                <HelpCircle size={14} />
              </button>
            </div>
            <select
              value={generationDepth}
              onChange={(e) => onDepthChange(Number(e.target.value) as 3 | 5 | 10)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none"
            >
              <option value={3}>Quick (3 cards)</option>
              <option value={5}>Standard (5 cards)</option>
              <option value={10}>Deep (10 cards)</option>
            </select>
          </div>
        )}

        {generatingDeck ? (
          <div className="flex items-center justify-center gap-1.5 py-2.5">
            <Loader2 size={13} className="animate-spin text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400">Processing…</span>
          </div>
        ) : (
          <button
            onClick={onUploadClick}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
          >
            + Upload PDF
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* ── PDF Tip Modal ─────────────────────────────────────────────────── */}
      {showPdfTip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowPdfTip(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-red-600">
              ⚠️ PDF Requirements
            </h3>
            <div className="space-y-2 text-sm text-gray-800">
              <p>Reprise only works with <strong>text-based PDFs</strong>.</p>
              <p>Please avoid:</p>
              <ul className="ml-4 list-disc space-y-1 text-gray-700">
                <li>Scanned documents</li>
                <li>Image-only PDFs</li>
                <li>Handwritten notes photographed as PDF</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                💡 Tip: If you can select and copy text in your PDF viewer, it will work with Reprise!
              </p>
            </div>
            <button
              onClick={() => setShowPdfTip(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-600"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}