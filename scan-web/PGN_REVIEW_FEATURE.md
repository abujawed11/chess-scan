# PGN Review & Move Quality Feature - Priority 1

## ✅ Feature Added to Roadmap!

This feature has been added as **Priority 1, Feature #5** in the main roadmap.

---

## 🎯 Feature Overview

**Chess.com-style Game Review** - Load PGN files and analyze games with move quality labels, accuracy scores, and auto-play functionality.

---

## 📋 Feature Specification

### Goal
Let users load a PGN and review the game with move-by-move playback, quality labels (Book/Best/Excellent/Good/Inaccuracy/Mistake/Blunder), per-side accuracy, and simple auto-play—similar to chess.com's Game Review.

---

## 🎮 Scope (First Release)

### 1. PGN Import (Single Game)
- Read PGN tags: Event, Site, Date, White, Black, Result, ECO (if present)
- Parse main line only
- Ignore side variations for now
- Support drag-and-drop or file picker

### 2. Navigation & Playback
- **Prev/Next buttons**: Step through moves one by one
- **Keyboard arrows**: ← previous, → next move
- **Jump-to-move**: Click any move in the list to go there
- **Start/End**: Jump to beginning or end of game
- **Auto-Play**: Continuous playback with speed control
  - 0.5× speed (slow, 2 seconds per move)
  - 1× speed (normal, 1 second per move)
  - 2× speed (fast, 0.5 seconds per move)
- **Pause/Resume**: Stop auto-play at any point

### 3. Move List UI
- Display: move number + SAN notation + quality badge
- Highlight current ply (active move)
- Show PGN comments/NAGs (read-only)
- Scrollable list (auto-scroll to current move)
- Compact design for right-side panel

### 4. Book Detection
- Flag moves as "Book" if position is in local opening book
- Check first ~16 plies (opening phase)
- Local JSON opening database
- Book moves override other quality labels

### 5. Move Quality Classification

**Based on evaluation delta** (best engine line vs played move):

| Quality | Centipawn Loss | Badge Color | Icon |
|---------|---------------|-------------|------|
| **Book** | N/A (from opening book) | Blue | 📖 |
| **Best** | ≤15cp | Green | ✓ |
| **Excellent** | ≤50cp | Light Green | ✓ |
| **Good** | ≤120cp | Yellow-Green | ○ |
| **Inaccuracy** | 120–300cp | Yellow | ⚠️ |
| **Mistake** | 300–700cp | Orange | ❌ |
| **Blunder** | >700cp | Red | ❌❌ |

**Rules:**
- "Book" overrides all other labels
- Thresholds are tunable (user preference)
- Mate scores treated as large centipawn values

### 6. Accuracy Score (Per Player)

**Formula:**
```
Accuracy = 100 - (Total Penalty / Total Moves) * scaling_factor
```

**Penalties per move quality:**
- Best: 0 points
- Excellent: 5 points
- Good: 15 points
- Inaccuracy: 40 points
- Mistake: 100 points
- Blunder: 200 points
- Book: 0 points (not counted)

**Result:** 0–100 score per player
- 95-100: Brilliant play
- 85-94: Strong play
- 70-84: Good play
- 50-69: Average play
- <50: Weak play

### 7. Summary Panel

**Display:**
- **Player Names**: White vs Black
- **Result**: 1-0, 0-1, 1/2-1/2
- **Opening/ECO**: Name and code (if known)
- **Accuracy Scores**: White: 87%, Black: 82%
- **Move Quality Counts**:
  - 📖 Book: 8 moves
  - ✓ Best: 12 moves
  - ✓ Excellent: 15 moves
  - ○ Good: 8 moves
  - ⚠️ Inaccuracy: 3 moves
  - ❌ Mistake: 1 move
  - ❌❌ Blunder: 0 moves

### 8. Reliability & Fallback

**If engine analysis unavailable:**
- Users can still import and navigate PGN
- Move list shows moves without quality badges
- Message: "Analysis unavailable - playing through moves only"
- Unscored moves clearly marked

**Graceful degradation:**
- Large PGNs: Show progress indicator for analysis queue
- Failed analysis: Mark specific moves as "Not analyzed"
- Partial analysis: Show analyzed moves, mark unanalyzed

---

## 🚫 Out of Scope (This Release)

- Side-variation trees (branches)
- Editing PGN files
- Multi-PV UI (showing alternative lines)
- Endgame tablebases integration
- Cloud engine analysis
- Multiplayer sharing
- Multiple game import (databases)
- Eval graph visualization

---

## 👤 User Stories

### Story 1: Quick Game Review
> *As a player*, I can drop a PGN file and immediately step through the game with Next/Prev or Auto-Play.

**Flow:**
1. Click "Load PGN" or drag-drop file
2. Game loads, shows player names and opening
3. Click "Auto-Play" to watch game
4. See moves animate on board with quality badges

### Story 2: Learn from Mistakes
> *As a learner*, I can see which moves were Book, good, or mistakes, and get an overall accuracy for both sides.

**Flow:**
1. Load game PGN
2. See accuracy scores: White 85%, Black 72%
3. Scroll move list, see red badges on blunders
4. Click blunder move, see position on board
5. Understand what went wrong

### Story 3: Review with Comments
> *As a reviewer*, I can click any move in the list to jump the board there and read PGN comments.

**Flow:**
1. Load annotated PGN (has comments)
2. See move with comment icon
3. Click move, board jumps to position
4. Read comment explaining the idea
5. Navigate to next critical position

---

## 🎨 UX Design Notes

### Board Controls Layout
```
┌─────────────────────────────────────┐
│         ChessBoard (560x560)        │
└─────────────────────────────────────┘
[⏮ Start] [◀ Prev] [▶ Play] [▶▶ Next] [⏭ End]
Speed: [0.5× / 1× / 2×]
Move: [──●────────────] 25/40
```

### Right-Side Panel
```
┌───────────────────────────┐
│     Game Summary          │
│ White: Carlsen (85%)      │
│ Black: Caruana (82%)      │
│ Result: 1/2-1/2           │
│ Opening: Ruy Lopez, C90   │
│                           │
│ 📖 Book: 8                │
│ ✓ Best: 12                │
│ ○ Good: 8                 │
│ ⚠️ Inaccuracy: 3          │
│ ❌ Blunder: 1             │
├───────────────────────────┤
│      Move List            │
│ 1. e4 📖  e5 📖           │
│ 2. Nf3 ✓  Nc6 ✓          │
│ 3. Bb5 ✓  a6 ⚠️          │ ← Current
│ 4. Ba4 ○  Nf6 ✓          │
│ ...                       │
└───────────────────────────┘
```

### Compact Design
- Keep controls adjacent to board
- Right panel: 350px wide (current sidebar size)
- Summary: Collapsible for more space
- Move list: Scrollable, auto-follows current move
- Eval bar: Optional, don't block on it

---

## 📊 Data & Technical Notes (Non-Implementation)

### Performance
- **Cache evaluations per FEN**: Avoid re-computing
- **Background analysis**: Don't block UI
- **Lazy evaluation**: Analyze on-demand (first time jumping to position)

### Opening Book
- **Format**: JSON file with positions and moves
- **Size**: ~50KB for common openings (first 12-16 plies)
- **Structure**: `{ "fen": "...", "moves": ["e4", "d4", ...], "eco": "C90", "name": "Ruy Lopez" }`

### Accuracy Calculation
- Normalize penalties by number of scored moves
- Exclude Book moves from penalty calculation
- Handle mate scores as ±10000 centipawns

### Persistence
- **localStorage**: Last reviewed game metadata
- **Resume**: Open app, continue from last position
- **Format**: `{ pgn, currentMoveIndex, timestamp }`

---

## ✅ Acceptance Criteria

### AC1: PGN Loading
**Given** a valid PGN file
**When** user loads it
**Then** the app shows:
- Player names
- Game result
- Opening name (if available)
- Clickable move list
- Board at starting position

**And** clicking move *n* sets board to that position

### AC2: Auto-Play
**Given** a loaded game
**When** user clicks "Play" and selects speed
**Then** the board advances one ply per chosen speed
**And** stops at game end or on user interaction

### AC3: Book Detection
**Given** a game with known opening moves
**When** analysis completes
**Then** moves matching book lines show "Book" badge
**And** non-book moves show quality label per thresholds

### AC4: Accuracy Display
**Given** a completed game analysis
**When** viewing summary panel
**Then** per-side accuracy displays (0-100%)
**And** changes if user adjusts thresholds

### AC5: Graceful Fallback
**Given** engine analysis is unavailable
**When** user loads PGN
**Then** navigation remains usable
**And** unscored moves show as "Not analyzed"
**And** user sees helpful message

---

## ⚠️ Dependencies & Risks

### Dependencies
1. **Local opening book**: JSON file with common openings
2. **Stockfish background evaluation**: Already integrated
3. **PGN parser**: Need library (e.g., chess.js can parse PGN)

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Large PGN analysis takes too long | High | Progress indicator, abort option |
| Opening book missing | Medium | Graceful fallback, all moves analyzed by engine |
| Evaluation cache grows large | Low | Limit cache size, LRU eviction |
| Mate scores break math | Medium | Treat mate as ±10000cp |

---

## ⏱️ Effort Estimate

**Total: 5–7 days** for first release

### Breakdown:
1. **PGN Parser Integration** (1 day)
   - Import chess.js PGN parsing
   - Extract tags and moves
   - Handle errors gracefully

2. **Navigation UI** (1 day)
   - Prev/Next/Start/End buttons
   - Auto-play with speed control
   - Keyboard shortcuts
   - Move slider/scrubber

3. **Move List Component** (1 day)
   - Display moves with badges
   - Click-to-jump functionality
   - Highlight current move
   - Show comments/NAGs

4. **Move Quality Analysis** (1.5 days)
   - Opening book integration
   - Quality classification logic
   - Badge rendering
   - Threshold configuration

5. **Accuracy Calculation** (0.5 days)
   - Penalty system
   - Per-player scoring
   - Display in summary panel

6. **Summary Panel** (1 day)
   - Game metadata display
   - Accuracy scores
   - Move quality counts
   - Icons and styling

7. **Testing & Polish** (1 day)
   - Edge cases (no ECO, long games, comments)
   - Performance optimization
   - UX refinements

---

## 🔮 Follow-ups (P1.5/P2)

### Phase 1.5: Enhanced Analysis
- **Eval bar/graph**: Visual evaluation history
- **Multi-PV display**: Show top 3 lines with evaluations
- **Principal variation**: Show best move sequence

### Phase 2: Advanced Features
- **Side-variation browsing**: Explore alternative lines
- **Shareable review links**: Generate URLs for sharing
- **Import multiple games**: Database of games
- **Export annotated PGN**: Save analysis as PGN

---

## 📝 Implementation Checklist

- [ ] Add "Load PGN" option to Home page
- [ ] Integrate chess.js PGN parser
- [ ] Create Game Review page component
- [ ] Build navigation controls UI
- [ ] Implement move list component
- [ ] Add opening book JSON file
- [ ] Create book detection logic
- [ ] Implement quality classification
- [ ] Build accuracy calculator
- [ ] Create summary panel component
- [ ] Add auto-play functionality
- [ ] Implement keyboard shortcuts
- [ ] Add fallback for missing analysis
- [ ] Performance: Cache FEN evaluations
- [ ] Polish: Smooth transitions
- [ ] Test: Large PGNs, edge cases
- [ ] Document: User guide for PGN review

---

## 🎯 Success Metrics

### User Engagement
- % of users who load PGNs
- Average time spent in review mode
- Number of games reviewed per session

### Feature Usage
- Auto-play usage rate
- Most common speed (0.5×/1×/2×)
- Average accuracy scores
- Most common move quality (Book/Best/Mistake)

### Technical
- PGN parse success rate (>95%)
- Analysis completion time (<30s for 40-move game)
- Cache hit rate (>80%)

---

## 📚 Resources

### PGN Format Reference
- [PGN Specification](https://www.chessclub.com/help/PGN-spec)
- [chess.js PGN methods](https://github.com/jhlywa/chess.js)

### Opening Book Sources
- [ECO Codes](https://www.365chess.com/eco.php)
- [Lichess Opening Explorer API](https://lichess.org/api#operation/apiExplorerMaster)

### Inspiration
- [Chess.com Game Review](https://www.chess.com/analysis)
- [Lichess Computer Analysis](https://lichess.org/analysis)

---

**Status:** 📋 Documented in Priority 1
**Next Steps:** Implement after Priority 1 Features 1-4 complete
**Estimated Start:** Week 2-3
