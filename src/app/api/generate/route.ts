import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { buildSystemPrompt } from '@/lib/teacherPrompt';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawCard {
  subject: string;
  question: string;
  hint1: string;
  hint2: string;
  solution: string;
}

// ─── pdf-parse (server-side extraction) ──────────────────────────────────────
// Optional path: client sends { pdfBase64 } instead of { text }.
// Install with: npm install pdf-parse @types/pdf-parse

async function extractWithPdfParse(base64: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string }>;
  const { text } = await pdfParse(Buffer.from(base64, 'base64'));
  return text;
}

// ─── Noise stripping ──────────────────────────────────────────────────────────

function stripNoise(text: string): string {
  // 1. Remove URLs and emails
  let out = text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/www\.\S+/g, '')
    .replace(/\S+@\S+\.\S+/g, '');

  // 2. Remove standalone page numbers ("3", "Page 3", "Page 3 of 12")
  out = out
    .replace(/^\s*\d+\s*$/gm, '')
    .replace(/^\s*page\s+\d+(\s+of\s+\d+)?\s*$/gim, '');

  // 3. Remove lines that repeat more than 3 times (running headers / footers)
  const lines = out.split('\n');
  const freq: Record<string, number> = {};
  for (const l of lines) {
    const k = l.trim().toLowerCase();
    if (k.length > 4) freq[k] = (freq[k] ?? 0) + 1;
  }
  out = lines
    .filter(l => {
      const k = l.trim().toLowerCase();
      return k.length <= 4 || (freq[k] ?? 0) <= 3;
    })
    .join('\n');

  // 4. Collapse whitespace
  return out
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// ─── Strategic sampling ───────────────────────────────────────────────────────
// If the document exceeds 12 000 chars, take three slices that capture
// the opening argument, the conceptual core, and the closing summary.

const SAMPLE_THRESHOLD = 12_000;

function strategicSample(text: string): string {
  if (text.length <= SAMPLE_THRESHOLD) return text;

  const len    = text.length;
  const first  = text.slice(0, 4_000);
  const midOff = Math.floor(len / 2) - 2_000;
  const middle = text.slice(midOff, midOff + 4_000);
  const last   = text.slice(len - 2_000);

  return [
    '=== DOCUMENT OPENING ===', first,
    '\n=== DOCUMENT MIDDLE ===', middle,
    '\n=== DOCUMENT CLOSING ===', last,
  ].join('\n');
}

// ─── Anthropic client ─────────────────────────────────────────────────────────

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    text?:      string;   // pre-extracted by client (current flow)
    pdfBase64?: string;   // raw PDF bytes encoded as base64 (server-side flow)
    deckTitle?: string;
    depth?:     number;
  };

  // Clamp depth to the three supported values; default to 5
  const depthRaw = Number(body.depth);
  const depth: 3 | 5 | 10 = depthRaw === 3 ? 3 : depthRaw === 10 ? 10 : 5;

  // ── 1. Obtain raw text ────────────────────────────────────────────────────
  let rawText = '';

  if (body.pdfBase64) {
    // Server-side path: decode and parse the PDF binary with pdf-parse
    try {
      rawText = await extractWithPdfParse(body.pdfBase64);
    } catch (err) {
      console.error('pdf-parse extraction failed:', err);
      return Response.json(
        { error: 'Could not extract text from this PDF. It may be scanned or image-only. Try exporting it as a text-based PDF first.' },
        { status: 422 },
      );
    }
  } else {
    // Client-side path: text was already extracted by pdfjs-dist in the browser
    rawText = (body.text ?? '').trim();
  }

  if (!rawText.trim()) {
    return Response.json(
      { error: 'No extractable text found. If this is a scanned document, try a text-based export or a different PDF version.' },
      { status: 400 },
    );
  }

  // ── 2. Sanitise ───────────────────────────────────────────────────────────
  const sanitised = stripNoise(rawText);

  if (sanitised.length < 200) {
    return Response.json(
      { error: 'This document structure is too complex for clear extraction. Please try a text-based version.' },
      { status: 422 },
    );
  }

  // ── 3. Strategic sample (cap payload to a safe size) ─────────────────────
  const finalText = depth === 10
    ? strategicSample(sanitised.slice(0, 20_000))
    : strategicSample(sanitised);

  // ── 4. Generate cards with the correct depth ──────────────────────────────
  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: depth === 10 ? 8000 : 4096,
    system:     buildSystemPrompt(depth),
    messages: [
      {
        role:    'user',
        content: `Document title: "${body.deckTitle ?? 'Untitled'}"\n\nFirst identify the primary subject (Mathematics, Chemistry, Physics, Biology, History, etc.) and core concept. Then generate exactly ${depth} flashcards from the content below.\n\n${finalText}`,      
      },
    ],
  });

  // ── 5. Parse response ─────────────────────────────────────────────────────
  const raw = message.content.find((b) => b.type === 'text')?.text ?? '[]';

  let cards: RawCard[];
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    cards = JSON.parse(cleaned) as RawCard[];
    if (!Array.isArray(cards)) throw new Error('Not an array');
  } catch {
    return Response.json({ error: 'Model returned invalid JSON', raw }, { status: 500 });
  }

  return Response.json({ cards });
}
