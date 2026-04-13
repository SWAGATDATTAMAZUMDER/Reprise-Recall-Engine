# REPRISE: AI-Driven Mastery Engine

**Reprise** is a high-performance study platform designed for complex sciences (Mathematics, Biology, Physics, Chemistry). Unlike standard flashcard apps, Reprise utilizes a **Three-Stage Cognitive Reveal** system and the **SM-2 Spaced Repetition Algorithm** to transform passive reading into permanent neural mastery.

## Key Features

### The "Reprise Protocol" (1-3-6 Timeline)

We don't just show cards; we manage your memory. The platform visualizes the mastery journey across three critical milestones:

- **Day 1: Active Encoding** – AI extracts high-yield concepts from your PDFs.
    
- **Day 3: Neural Reinforcement** – A two-stage hint system forces "active recall" before revealing the answer.
    
- **Day 6: Cognitive Mastery** – Final verification locks the information into long-term storage via the SM-2 algorithm.
    

### Scientific & Mathematical Fidelity

- **Complex LaTeX Support:** Flawless rendering of advanced calculus, physics equations, and integrals (e.g., Gaussian integrals).
    
- **Chemical Notation:** Full support for `\ce{}` syntax to render chemical formulas and reactions accurately.
    

### Intelligent Ingestion

- **PDF-to-Card Pipeline:** Instantly convert textbook chapters or research papers into structured study decks.
    
- **Contextual Categorization:** AI automatically tags content with appropriate academic subjects (e.g., Biology/Environmental Studies).
    
- **Privacy-First Persistence:** All decks and mastery data are stored locally on your device for total privacy.
    

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
    
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom Glassmorphism UI.
    
- **Icons:** [Lucide-React](https://lucide.dev/).
    
- **Math Rendering:** [KaTeX](https://katex.org/) with `mhchem` extension.
    
- **AI Engine:** Claude-3 / Gemini-3 Flash via surgical JSON-structured prompting.
    

---

##  Getting Started

### Prerequisites

- Node.js 18.x or later.
    
- An API Key for the LLM of your choice (Claude/Gemini).
    

### Installation

1. Clone the repository.
    
2. Install dependencies:
    
    Bash
    
    ```
    npm install
    ```
    
3. Configure your `.env.local` with your API credentials.
    
4. Run the development server:
    
    Bash
    
    ```
    npm run dev
    ```
    

---

## Architecture & Reliability

- **Token Optimization:** Implemented `.claudeignore` protocols to manage large context windows and bypass 429 rate limit errors during deep generation.
    
- **Structural Integrity:** Robust JSON sanitization ensures 10-card "Deep" generations remain stable even with complex formatting.
    
- **Safety Guardrails:** Integrated "Delete Confirmation" modals to protect user data from accidental erasure.
    

---

## Why "Reprise"?

In music, a _reprise_ is a return to a theme. In learning, it is the return to a concept that turns a temporary thought into a permanent skill. Reprise was built for the student who doesn't just want to pass the exam, but wants to **Master the Material.**