# Post-Game Analysis - Implementation Checklist

## 🎯 Overview
Post-Game Analysis allows users to analyze completed games using the PGN Review system. Estimated effort: 2-3 days.

---

## 📋 PHASE 1: Game-to-PGN Conversion (4 hours)

### Task 1.1: Create gameToPgn Utility
- [ ] Create `src/utils/pgn/gameToPgn.js`
- [ ] Implement `gameToPgn(gameData)` function
- [ ] Handle game object with moves array, result, players, metadata
- [ ] Generate standard PGN format with tags
- [ ] Support all game modes (HvH, HvC, CvC)
- [ ] Include timestamps in metadata
- [ ] Test with manual PGN string generation

### Task 1.2: PGN Tag Implementation
- [ ] Required tags: Event, Site, Date, White, Black, Result
- [ ] Optional tags: ECO, Opening, WhiteElo, BlackElo
- [ ] Metadata: TimeControl, GameMode, Difficulty
- [ ] Format Date as YYYY.MM.DD
- [ ] Map Result: "1-0" (white), "0-1" (black), "1/2-1/2" (draw)

### Task 1.3: Move Format
- [ ] Convert move objects to SAN (Standard Algebraic Notation)
- [ ] Format: 1. e4 e5 2. Nf3 Nc6
- [ ] Handle promotions correctly
- [ ] Include move comments if available
- [ ] Format for 80-char line width (standard)

### Task 1.4: Testing
- [ ] Test HvH game conversion
- [ ] Test HvC game conversion
- [ ] Test CvC game conversion
- [ ] Validate PGN with online PGN reader
- [ ] Test edge cases (draw, resignation, checkmate)

---

## 📋 PHASE 2: Game Over Modal Enhancement (3 hours)

### Task 2.1: Add Analysis Button to Game Over Modal
- [ ] Modify game over section in GamePlay.jsx
- [ ] Add "Analyze Game" button
- [ ] Styling: Green button, prominent placement
- [ ] Position: Next to [Rematch] [New Game] [Home] buttons
- [ ] On click: Trigger analysis flow

### Task 2.2: Game Over Modal UI
- [ ] Display result (e.g., "Checkmate! White wins")
- [ ] Show final board position
- [ ] Show game duration/move count
- [ ] Display opponent info (if vs Computer)
- [ ] Button layout: [Analyze Game] | [Rematch] | [New Game] | [Home]

### Task 2.3: Navigation Flow
- [ ] Click "Analyze Game"
- [ ] App switches to post-game-analysis mode
- [ ] Passes game data to analysis
- [ ] Sets up analysis UI
- [ ] Starts PGN generation

### Task 2.4: State Management
- [ ] Store game completion data in App state
- [ ] Pass moveHistory and metadata
- [ ] Track game mode and players
- [ ] Clear after analysis starts

---

## 📋 PHASE 3: Analysis Integration (1 day - 8 hours)

### Task 3.1: Create usePostGameAnalysis Hook
- [ ] Create `src/hooks/usePostGameAnalysis.js`
- [ ] State: analyzing, progress, results, cacheMap
- [ ] Function: startAnalysis(moves, depth)
- [ ] Function: cancelAnalysis()
- [ ] Function: getResults() - returns analyzed moves
- [ ] Function: saveProgress(moveIndex, evaluation)

### Task 3.2: Analysis Queue Implementation
- [ ] Iterate through moves sequentially
- [ ] For each move:
  - Get FEN before move
  - Get FEN after move
  - Request Stockfish analysis (depth 15-18)
  - Wait for evaluation
  - Calculate eval delta
  - Classify move quality
- [ ] Cache evaluations by FEN
- [ ] Update progress state

### Task 3.3: Progress Tracking
- [ ] Calculate total moves to analyze
- [ ] Update progress: `(currentIndex / total) * 100`
- [ ] Display: "Analyzing move 15/40..."
- [ ] Allow UI updates during analysis
- [ ] Smooth progress updates

### Task 3.4: Create PostGameAnalysis Component
- [ ] Create `src/components/pages/PostGameAnalysis.jsx`
- [ ] Reuse GameReview component
- [ ] Show progress bar during analysis
- [ ] Display "Analyzing..." with move count
- [ ] Allow cancel button
- [ ] Show results as they complete

### Task 3.5: Integration with GameReview
- [ ] Pass analyzed moves to GameReview
- [ ] Load move quality badges
- [ ] Calculate accuracy scores
- [ ] Setup navigation controls
- [ ] Enable move playback

### Task 3.6: Caching Strategy
- [ ] Cache evaluations in state
- [ ] Store: FEN → { evaluation, mate, depth }
- [ ] Reuse cached evals if analyzing same position
- [ ] Optional: localStorage persistence (Phase 4)

### Task 3.7: Error Handling
- [ ] Handle analysis timeout (>5s per move)
- [ ] Handle Stockfish crash
- [ ] Display error message with retry
- [ ] Allow continue despite errors
- [ ] Mark unanalyzed moves clearly

---

## 📋 PHASE 4: Storage & Library (1 day - 8 hours)

### Task 4.1: Create useGameLibrary Hook
- [ ] Create `src/hooks/useGameLibrary.js`
- [ ] Function: saveGame(gameData, analysis)
- [ ] Function: getGames() - return all saved games
- [ ] Function: getGame(gameId)
- [ ] Function: deleteGame(gameId)
- [ ] Function: searchGames(query)
- [ ] Function: filterGames(filter)

### Task 4.2: Game Library Storage
- [ ] Use localStorage key: "chess-scan-games"
- [ ] Store as JSON array
- [ ] Game structure:
  ```javascript
  {
    id: UUID,
    date: timestamp,
    white: "Player Name",
    black: "Player Name",
    result: "1-0" | "0-1" | "1/2-1/2",
    pgn: "PGN string",
    moves: [...],
    analysis: { moveQualities: [...], accuracy: {...} },
    gameMode: "hvh" | "hvc" | "cvc",
    tags: { Event, Site, ECO, ... }
  }
  ```

### Task 4.3: Save Game UI
- [ ] Add "Save Game" button after analysis
- [ ] Show "Saved!" confirmation
- [ ] Allow save with custom name
- [ ] Add tags/notes (optional)
- [ ] Option to export as file

### Task 4.4: Create GameLibrary Component
- [ ] Create `src/components/GameLibrary.jsx`
- [ ] List all saved games in table format
- [ ] Columns: Date | White | Black | Result | Accuracy | Actions
- [ ] Sorting: by date (default), by accuracy, by result
- [ ] Search: by player name, opening
- [ ] Filter: by game mode, by result (win/loss/draw)

### Task 4.5: Game Library Actions
- [ ] [View] - Open game in analysis mode
- [ ] [Delete] - Remove from library
- [ ] [Export] - Download PGN file
- [ ] Confirmation dialog before delete
- [ ] Batch delete option

### Task 4.6: Library Navigation
- [ ] Add "My Games" button in Home
- [ ] Add "Back to Home" button in library
- [ ] Add "New Analysis" button to start game
- [ ] Show game count in tab

### Task 4.7: Data Persistence
- [ ] Save on every save action
- [ ] Load from localStorage on app start
- [ ] Handle localStorage quota exceeded
- [ ] Optional: JSON export/import
- [ ] Optional: Cloud sync (future)

---

## 📋 PHASE 5: Testing & Polish (4 hours)

### Task 5.1: Functional Testing
- [ ] Test HvH game → analyze → save → library
- [ ] Test HvC game → analyze → save → library
- [ ] Test CvC game → analyze → save → library
- [ ] Test win/loss/draw scenarios
- [ ] Test resignation handling

### Task 5.2: Edge Cases
- [ ] Very short games (< 5 moves)
- [ ] Very long games (> 50 moves)
- [ ] Games with checks throughout
- [ ] Games with multiple captures
- [ ] Stalemate scenarios

### Task 5.3: UI Polish
- [ ] Progress bar animation smooth
- [ ] Move quality badges display correctly
- [ ] Accuracy score colors match design
- [ ] Table columns align properly
- [ ] Buttons have hover states

### Task 5.4: Performance
- [ ] Analysis doesn't freeze UI
- [ ] Progress updates smoothly
- [ ] Library loads quickly (< 1s)
- [ ] Searching is instant
- [ ] No memory leaks (unmount cleanup)

### Task 5.5: Mobile Responsive
- [ ] Game over modal fits mobile
- [ ] Analysis page responsive
- [ ] Library table scrollable on mobile
- [ ] Buttons touchable (min 44px)
- [ ] Text readable (font sizes)

### Task 5.6: Accessibility
- [ ] Button labels clear
- [ ] Colors have sufficient contrast
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Error messages clear

---

## 🔧 Related File Modifications

### src/components/pages/GamePlay.jsx
- [ ] Collect game data (moveHistory, result, players)
- [ ] Add "Analyze Game" button to game over modal
- [ ] Handle click: switch to analysis mode
- [ ] Pass data to PostGameAnalysis

### src/App.jsx
- [ ] Add "post-game-analysis" mode
- [ ] Add "library" mode
- [ ] Add navigation logic
- [ ] State: currentGame, analyzedResult

### src/utils/constants.js
- [ ] Add game analysis constants
- [ ] Analysis depth configs
- [ ] Storage keys
- [ ] Analysis timeouts

---

## ✅ Success Metrics

- [x] User can click "Analyze Game" after game ends
- [x] Game converts to PGN without errors
- [x] Analysis completes for typical game (< 5 minutes)
- [x] Move quality badges show (Book, !!, !, ?, ??)
- [x] Accuracy scores calculated and displayed
- [x] User can navigate through analyzed game
- [x] Games save to library
- [x] Library displays 10+ games without lag
- [x] Can search/filter library games
- [x] Works on mobile (responsive)

---

## 📅 Timeline Estimate

| Phase | Task | Hours | Status |
|-------|------|-------|--------|
| 1 | PGN Conversion | 4 | ⏳ Pending |
| 2 | Game Over Modal | 3 | ⏳ Pending |
| 3 | Analysis Integration | 8 | ⏳ Pending |
| 4 | Storage & Library | 8 | ⏳ Pending |
| 5 | Testing & Polish | 4 | ⏳ Pending |
| | **TOTAL** | **27** | ⏳ Pending |

**Estimated completion: 2-3 days of focused work**

---

## 🚀 How to Use This Checklist

1. **Start with Phase 1** - Get game-to-PGN working first
2. **Check off tasks** as you complete them
3. **Test incrementally** - Don't wait until the end
4. **Update status** - Keep timeline updated
5. **Document blockers** - Note any issues

---

## 🎊 Deliverable

A complete post-game analysis system that:
- Analyzes completed games automatically
- Shows move quality and accuracy
- Saves games to personal library
- Provides learning insights
- Matches professional chess apps (Chess.com, Lichess)
