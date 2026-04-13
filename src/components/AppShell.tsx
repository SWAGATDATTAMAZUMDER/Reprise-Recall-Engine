// V2.0 - Universal Ingestion & 1-3-6 Mastery Logic Active
'use client';

import HowItWorksModal from './HowItWorksModal';
import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';
import CardArea from './CardArea';
import {
  loadCards,
  saveCards,
  upsertCard,
  computeMasteryStats,
  countDueCards,
  loadLastSession,
  saveSession,
  loadDecks,
  saveDecks,
  upsertDeck,
  deleteDeck,
  type FlashcardRecord,
  type DeckRecord,
  type Rating,
  type SM2State,
} from '@/lib/storage';
import { DEFAULT_CARDS, SAMPLE_DECKS } from '@/lib/defaultDecks';

// ─── Loading phases ───────────────────────────────────────────────────────────

const LOADING_PHASES = [
  'Extracting high-yield concepts…',
  'Identifying common pitfalls…',
  'Formatting LaTeX solutions…',
] as const;

// ─── AppShell ─────────────────────────────────────────────────────────────────

export default function AppShell() {
  const [mounted, setMounted]           = useState(false);
  const [cards, setCards]               = useState<FlashcardRecord[]>([]);
  const [decks, setDecks]               = useState<DeckRecord[]>([]);
  const [selectedDeckId, setSelectedId] = useState('');
  const [isNewUser, setIsNewUser]       = useState(true);
  const [generatingDeck, setGenerating] = useState(false);
  const [generationDepth, setDepth]     = useState<3 | 5 | 10>(5);
  const [loadingPhase, setPhase]        = useState(0);
  const [phaseVisible, setPhaseVisible] = useState(true);
  const [showHelp, setShowHelp]         = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  // ── Seed / restore on mount ──────────────────────────────────────────────
  useEffect(() => {
    const lastSession = loadLastSession();
    setIsNewUser(lastSession === null);

    let storedDecks = loadDecks();
    if (storedDecks.length === 0) { saveDecks(SAMPLE_DECKS); storedDecks = SAMPLE_DECKS; }

    let storedCards = loadCards();
    if (storedCards.length === 0) { saveCards(DEFAULT_CARDS); storedCards = DEFAULT_CARDS; }

    setDecks(storedDecks);
    setCards(storedCards);
    setSelectedId(storedDecks[0]?.id ?? '');
    saveSession();
    setMounted(true);
  }, []);

  // ── Cycle loading phase text with a 300 ms fade ──────────────────────────
  useEffect(() => {
    if (!generatingDeck) { setPhase(0); setPhaseVisible(true); return; }
    const id = setInterval(() => {
      setPhaseVisible(false);
      setTimeout(() => {
        setPhase((p) => (p + 1) % LOADING_PHASES.length);
        setPhaseVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(id);
  }, [generatingDeck]);

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleRate(cardId: string, r: Rating, newSm2: SM2State) {
    const now = Date.now();
    const nextReviewDate = now + newSm2.interval * 86_400_000;
    const updated = cards.map((c) =>
      c.id === cardId ? { ...c, sm2: newSm2, rating: r, lastRated: now, nextReviewDate } : c
    );
    setCards(updated);
    const changed = updated.find((c) => c.id === cardId);
    if (changed) upsertCard(changed);
  }

  function handleReset(cardId: string) {
    const updated = cards.map((c) =>
      c.id === cardId
        ? { ...c, rating: null, lastRated: null, nextReviewDate: 0,
            sm2: { ef: 2.5, interval: 1, reps: 0 } }
        : c
    );
    setCards(updated);
    const changed = updated.find((c) => c.id === cardId);
    if (changed) upsertCard(changed);
  }

  function handleDeleteDeck(deckId: string) {
    deleteDeck(deckId);
    const remaining = decks.filter((d) => d.id !== deckId);
    setDecks(remaining);
    setCards((prev) => prev.filter((c) => c.deckId !== deckId));
    if (selectedDeckId === deckId) setSelectedId(remaining[0]?.id ?? '');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || typeof window === 'undefined') return;

    setGenerating(true);
    const deckId    = `deck-${Date.now()}`;
    const deckTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim() || 'New Deck';

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();

      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const pageTexts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const content = await (await pdf.getPage(i)).getTextContent();
        pageTexts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
      }

      const extractedText = pageTexts.join('\n\n').trim();
      if (!extractedText) {
        alert('Could not extract text. This PDF may be scanned or image-only.');
        setGenerating(false);
        return;
      }

      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: extractedText, deckTitle, depth: generationDepth }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `API error ${res.status}`);
      }

      const { cards: rawCards } = await res.json() as {
        cards: { subject: string; question: string; hint1: string; hint2: string; solution: string }[];
      };

      const newCards: FlashcardRecord[] = rawCards.map((c, i) => ({
        id: `${deckId}-${i}`, deckId,
        subject: c.subject, question: c.question,
        hint1: c.hint1, hint2: c.hint2, solution: c.solution,
        sm2: { ef: 2.5, interval: 1, reps: 0 },
        rating: null, lastRated: null, nextReviewDate: 0,
      }));

      const newDeck: DeckRecord = { id: deckId, title: deckTitle, isDefault: false };
      upsertDeck(newDeck);
      saveCards([...loadCards(), ...newCards]);
      setDecks((prev) => [...prev, newDeck]);
      setCards((prev) => [...prev, ...newCards]);
      setSelectedId(deckId);
    } catch (err) {
      console.error('Card generation failed:', err);
      alert(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────

  const deckCards      = cards.filter((c) => c.deckId === selectedDeckId);
  const deckStats      = computeMasteryStats(deckCards);
  const dueCount       = countDueCards(deckCards);
  const selectedDeck   = decks.find((d) => d.id === selectedDeckId);
  const loadingMessage = LOADING_PHASES[loadingPhase];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => setShowHelp(true)}
            className="absolute left-0 flex items-center gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-2 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
          >
            <Sparkles size={14} className="shrink-0 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-600">
              How Reprise Works
            </span>
          </button>
          <h1 className="text-3xl font-semibold tracking-widest text-gray-900">
            REPRISE
          </h1>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          decks={decks}
          cards={cards}
          selectedDeckId={selectedDeckId}
          deckStats={deckStats}
          generatingDeck={generatingDeck}
          generationDepth={generationDepth}
          loadingMessage={loadingMessage}
          phaseVisible={phaseVisible}
          fileInputRef={fileInputRef}
          onSelectDeck={setSelectedId}
          onDeleteDeck={(id) => setDeckToDelete(id)}
          onDepthChange={setDepth}
          onUploadClick={() => fileInputRef.current?.click()}
          onHelpClick={() => setShowHelp(true)}
          onFileChange={handleFileChange}
        />
        <CardArea
          mounted={mounted}
          deckCards={deckCards}
          deckStats={deckStats}
          dueCount={dueCount}
          selectedDeck={selectedDeck}
          isNewUser={isNewUser}
          generatingDeck={generatingDeck}
          loadingMessage={loadingMessage}
          phaseVisible={phaseVisible}
          onRate={handleRate}
          onReset={handleReset}
        />
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <HowItWorksModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {deckToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <ShieldAlert size={24} />
              </div>
              <h3 className="font-bold text-lg">Permanent Delete?</h3>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              This will permanently erase this deck and all your mastery progress. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeckToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteDeck(deckToDelete);
                  setDeckToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}