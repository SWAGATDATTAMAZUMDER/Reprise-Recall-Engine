// Client-only — import only from 'use client' components.

export type Rating = 'hard' | 'moderate' | 'easy';

export interface SM2State {
  ef: number;       // Ease Factor (min 1.3)
  interval: number; // Days until next review
  reps: number;     // Successful repetitions
}

export interface FlashcardRecord {
  id: string;
  deckId: string;
  subject: string;
  question: string;
  hint1: string;
  hint2: string;
  solution: string;
  sm2: SM2State;
  rating: Rating | null;
  lastRated: number | null;    // ms timestamp
  nextReviewDate: number;      // ms timestamp; 0 = immediately due
}

export interface DeckRecord {
  id: string;
  title: string;
  isDefault: boolean; // true = pre-installed sample, false = user upload
}

export interface MasteryStats {
  hard: number;
  moderate: number;
  easy: number;
  unrated: number;
}

const CARDS_KEY   = 'brain_cards';
const DECKS_KEY   = 'brain_decks';
const SESSION_KEY = 'brain_session';

// ── Decks ─────────────────────────────────────────────────────────────────────

export function loadDecks(): DeckRecord[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    return raw ? (JSON.parse(raw) as DeckRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveDecks(decks: DeckRecord[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function upsertDeck(deck: DeckRecord): void {
  const decks = loadDecks();
  const idx = decks.findIndex((d) => d.id === deck.id);
  if (idx === -1) decks.push(deck);
  else decks[idx] = deck;
  saveDecks(decks);
}

export function deleteDeck(deckId: string): void {
  saveDecks(loadDecks().filter((d) => d.id !== deckId));
  saveCards(loadCards().filter((c) => c.deckId !== deckId));
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export function loadCards(): FlashcardRecord[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? (JSON.parse(raw) as FlashcardRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveCards(cards: FlashcardRecord[]): void {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function upsertCard(card: FlashcardRecord): void {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.id === card.id);
  if (idx === -1) cards.push(card);
  else cards[idx] = card;
  saveCards(cards);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function computeMasteryStats(cards: FlashcardRecord[]): MasteryStats {
  return cards.reduce<MasteryStats>(
    (acc, c) => {
      if (c.rating === 'hard') acc.hard++;
      else if (c.rating === 'moderate') acc.moderate++;
      else if (c.rating === 'easy') acc.easy++;
      else acc.unrated++;
      return acc;
    },
    { hard: 0, moderate: 0, easy: 0, unrated: 0 }
  );
}

export function countDueCards(cards: FlashcardRecord[]): number {
  const now = Date.now();
  // A card is due if it has never been rated OR its scheduled review date has arrived.
  return cards.filter((c) => c.rating === null || c.nextReviewDate <= now).length;
}

// ── Session ───────────────────────────────────────────────────────────────────

export function loadLastSession(): number | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as number) : null;
  } catch {
    return null;
  }
}

export function saveSession(): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(Date.now()));
}
